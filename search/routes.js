var express = require('express');
var solr = require('solr-client');
var translate = require('../util/translate.js');
var alchemy = require('../util/alchemy.js');
var ddg = require('../util/ddg.js');
var wiki = require('../util/wiki.js');

var router = express.Router();

var client = solr.createClient({
    solrVersion: '4.0',
    host: 'ukkk58981644.kushalb.koding.io',
    port: 8983,
    core: 'bm25'
});

var buildQuery = function(req, res, next) {
    var q = req.query.q;

    //all languages 
    var allLang = [];
    //TODO : implement promises EVERYWHERE
    translate(q, ['en'], function(en) {
        alchemy.getEntities(en.join(' '), function(entities) {
            translate(q, ['en', 'fr', 'ru', 'de'], function(allLang) {
                req.query.q = (allLang.join(' ') + ' ' + entities.join(' ')).toLowerCase();
                next();
            });
        });
    });
};

var getSolrResponse = function(req, res, next) {
    //invoke solr client here

    var query = client.createQuery()
        .q(req.query.q)
        .edismax()
        .qf({
            text_fr: 1,
            tweet_hashtags: 1,
            entities: 1,
            primary_entity_types: 1,
            sec_entity_types: 1
        })
        .mm(2)
        .hl({
            on: true,
            simplePre: "<span class='hl-text'>",
            simplePost: "</span>",
            fl: "text_fr"
        })
        .start(req.query.start)
        .rows(req.query.rows);

    client.search(query, function(err, obj) {
        if (err) {
            console.log(err);
        }

        /* add highlighting */

        Object.keys(obj.highlighting).forEach(function(key) {
            var index = 0;
            var doc = obj.response.docs.filter(function(doc, i, _) {
                if (doc.id == key) {
                    index = i;
                    return true;
                }
            })[0];

            doc.text_fr_hl = obj.highlighting[key]['text_fr'][0];
            obj.response.docs[index] = doc;
        });

        obj.response.q = req.query.q;
        res.queryResult = obj.response;
        next();
    });
};

var getDDGSummaries = function(req, res, next) {
    //make sure that this is for the first query 

    if (req.query.start == 0) {
        //get UNIQUE entities of the top 5 results from queryResult
        var entities = (function() {

            return res.queryResult.docs
                //get top 5 docs
                .slice(0, 5)
                //get entities from top 5
                .map(function(doc) {
                    return doc.entities;
                })
                //flatten array of arrays 
                .reduce(function(a, b) {
                    return a.concat(b);
                }, [])
                // convert all entities to lowercase
                .join('|')
                .toLowerCase()
                .split('|')
                //sort to remove duplicates
                .sort()
                //remove duplicates
                .filter(function(item, pos, ary) {
                    return !pos || item != ary[pos - 1] && item != undefined;
                });

        })();

        //call ddg
        ddg.getSummaries(entities, function(summaries) {
            res.queryResult.summaries = summaries;
            next();
        });
    } else {
        next();
    }

}

var getWikiSummaries = function(req, res, next) {

    if (req.query.start == 0) {
        //filter out entities that don't have data
        var entities = (function() {
            return res.queryResult.summaries.filter(function(value) {
                    return !value.hasData;
                })
                .map(function(value) {
                    return value.name;
                });
        })();

        //copy items that have data to a new array
        var summaries = res.queryResult.summaries.filter(function(value) {
            return value.hasData;
        });

        wiki.getSummaries(entities, function(wikiSummaries) {
            res.queryResult.summaries = summaries.concat(wikiSummaries);
            next();
        });

    } else {
        next();
    }
}

var sendResponse = function(req, res, next) {
    res.send(res.queryResult);
}

/* GET home page. */
router.get('/', [buildQuery,
    getSolrResponse,
    getDDGSummaries,
    getWikiSummaries,
    sendResponse
]);

module.exports = router;
