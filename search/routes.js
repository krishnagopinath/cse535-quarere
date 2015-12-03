var express = require('express');
var solr = require('solr-client');
var translate = require('../util/translate.js');
var alchemy = require('../util/alchemy.js');

var router = express.Router();

var client = solr.createClient({
    solrVersion: '4.0',
    host: 'ukkk58981644.kushalb.koding.io',
    port: 8983,
    core: 'bm25'
});

router.use(function(req, res, next) {
    var q = req.query.q;

    //all languages 
    var allLang = [];
    //TODO : implement promises EVERYWHERE
    translate(q, ['en'], function(en) {
        alchemy.getEntities(en.join(' '), function(entities) {
            translate(q, ['en', 'fr', 'ru', 'de'], function(allLang) {
                req.query.q = allLang.join(' ') + ' ' + entities.join(' ');
                next();
            });
        });
    });
});

/* GET home page. */
router.get('/', [function(req, res, next) {

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
        .start(req.query.start)
        .rows(req.query.rows);

    client.search(query, function(err, obj) {
        if (err) {
            console.log(err);
        }

        res.queryResult = obj.response;
        obj.response.q = req.query.q;
        next();
    });
}, function(req, res, next) {
    res.send(res.queryResult);
}]);

module.exports = router;
