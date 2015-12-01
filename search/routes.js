var express = require('express');
var solr = require('solr-client');

var router = express.Router();

var client = solr.createClient({
    solrVersion: '4.0',
    host: '192.168.1.187',
    port: 8983,
    core: 'vsm'
});

/* GET home page. */
router.get('/', function(req, res, next) {
    //invoke solr client here

    var query = client.createQuery()
        .q(req.query.q)
        .edismax()
        .qf({
            text_en: 1,
            text_de: 1,
            text_ru: 1
        })
        .mm(2)
        .start(req.query.start)
        .rows(req.query.rows);

    client.search(query, function(err, obj) {
        if (err) {
            console.log(err);
        } else {
            res.send(obj.response);
        }
    });


});

module.exports = router;
