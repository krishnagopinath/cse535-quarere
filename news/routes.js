var express = require('express');
var news = require('../util/news_xml2json.js');

router = express.Router();

router.get('/', function (req, res, next) {
	news.getNews(req.query.q, function (response) {
		res.send(response);
	});
});

module.exports = router;