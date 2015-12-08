var express = require('express');
var solr = require('solr-client');
var translate = require('../util/translate.js');
var alchemy = require('../util/alchemy.js');
var ddg = require('../util/ddg.js');
var wiki = require('../util/wiki.js');
var _ = require("lodash");

var router = express.Router();

var client = solr.createClient({
    solrVersion: '4.0',
    host: '192.168.1.169',
    port: 8983,
    core: 'bm25'
});

var buildQuery = function(req, res, next) {
    var q = req.query.q;

    //all languages 
    var allLang = [];
    //TODO : implement promises EVERYWHERE
    translate(q, ['en'], function(en) {
        //alchemy.getEntities(en.join(' '), function(entities) {
            translate(q, ['en', 'fr', 'ru', 'de'], function(allLang) {
                req.query.q = (allLang.join(' ')).toLowerCase();
								console.log("q:"+req.query.q);
                next();
            });
        //});
    });
};

var getSolrResponse = function(req, res, next) {
    //invoke solr client here

    var query = client.createQuery()
        .q(req.query.q)
        .edismax()
        .qf({
            text_fr: 1,
					  text_en: 1,
					  text_ru: 1,
					  text_de: 1,
            tweet_hashtags: 1,
            entities: 2
            //primary_entity_types: 1
            //sec_entity_types: 1
        })
        .hl({
            on: true,
            simplePre: "<span class='hl-text'>",
            simplePost: "</span>",
            fl: "text_fr, text_en, text_de, text_ru"
        })
        .start(req.query.start)
        .rows(req.query.rows);

    //facets
    if (req.query.facets) {
        query.facet({
            on: true,
            mincount: 1,
            field: ['primary_entity_types']
        });
        if (req.query.fq) {
            req.query.fq.split(',').forEach(function(fqItem) {
                query.matchFilter("primary_entity_types", fqItem);
                console.log(fqItem)
            });
        }
    }


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
						if(obj.highlighting[key]['text_fr']) {
            	doc.text_fr_hl = obj.highlighting[key]['text_fr'][0];
						} else if(obj.highlighting[key]['text_en']) {
            	doc.text_fr_hl = obj.highlighting[key]['text_en'][0];
						} else if(obj.highlighting[key]['text_ru']) {
            	doc.text_fr_hl = obj.highlighting[key]['text_ru'][0];
						} else if(obj.highlighting[key]['text_de']) {
            	doc.text_fr_hl = obj.highlighting[key]['text_de'][0];
						} else {
							doc.text_fr_hl = doc['text_'+doc.lang];
						}
            obj.response.docs[index] = doc;
        });

        obj.response.q = req.query.q;


        obj.response.facets = (function() {


            var facetItems = [];

            if (obj.facet_counts) {
                facets = obj.facet_counts.facet_fields.primary_entity_types;

                for (var i = 0; i < facets.length; i += 2) {
                    facetItems.push({
                        "name": facets[i],
                        "count": facets[i + 1],

                    })
                };
            }

            return facetItems;
        })();

        res.queryResult = obj.response;
        next();
    });
};

var getDDGSummaries = function(req, res, next) {
    //make sure that this is for the first query 

    if (req.query.start == 0) {
        //get UNIQUE entities of the top 5 results from queryResult
        var entities = (function() {

            var arr = res.queryResult.docs
                //get top 5 docs
                .slice(0, 10)
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
                .filter(function(val) {
                    return val.length !== 0
                });

            arr = _.countBy(arr.sort(), function(val) {
                return val;
            });

            arr = Object.keys(arr).map(function(en) {
                return {
                    name: en,
                    freq: arr[en]
                }
            });

            return arr;
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
        /*
        //removed for the sake of preserving order, so that relevant summaries stay on top
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
        console.log(entities);
        */
        wiki.getSummaries(res.queryResult.summaries, function(wikiSummaries) {
            res.queryResult.summaries = wikiSummaries;
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
