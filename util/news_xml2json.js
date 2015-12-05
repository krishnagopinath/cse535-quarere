var parser = require('xml2json');
var request = require('request');
var he = require('he');
var cheerio = require('cheerio');


String.prototype.escapeHTML = function() {
    return this
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#039;/g, "'");
}

var getNews = function(keywords, callback) {
    //encode to proper URI format
    keywords = encodeURI(keywords);

    //construct URL
    var url = "https://news.google.com/news/section?q=" + keywords + "&output=rss&n=100";

    var options = {
        object: false,
        reversible: false,
        coerce: false,
        sanitize: true,
        trim: true,
        arrayNotation: false
    };

    var result = request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {

            var news = [];

            var r = parser.toJson(body, options);
            var p = JSON.parse(r);
            var obj = p['rss']['channel']['item'];
            if (obj) {
                for (i = 0; i < obj.length; i++) {

                    var date = new Date(obj[i].pubDate);

                    var html = he.decode(obj[i].description)

                    $ = cheerio.load(html);

                    news[i] = {
                        link: obj[i].guid['$t'].split("=")[1],
                        title: obj[i].title.escapeHTML().split('-')[0],
                        day: date.getDate(),
                        month: date.toLocaleString('en-us', {
                            month: "short"
                        }),
                        img: $('table img').attr('src'),
                        domain: $('table img').next().next().text(),
                        description: $($("table .lh font")[2]).text()
                    }

                }
            }
            callback(news);
        } else {
            console.log("error");
        }
    });

}

module.exports = {
    getNews: getNews
};
