var wiki = require('node-wikipedia');
var cheerio = require('cheerio');
var async = require('async');

//image, title, description, url
function getSummaries(entities, onDone) {

    var summaries = [];

    async.each(entities, function(entity, callback) {
        wiki.page.data(entity, {
            content: true
        }, function(response) {
            if (response) {
                $ = cheerio.load(response.text["*"]);

                var summary = {
                    name: entity,
                    img: "",
                    title: response.title,
                    source: "Wikipedia",
                    summary: "",
                    url: "https://en.wikipedia.org/?curid=" + response.pageid,
                    hasData: true
                }

                $(".infobox").filter(function() {
                    var self = $(this);
                    summary.img = "https://" + self.find("img").attr("src");
                    summary.summary = self.next().text().slice(0, 150);
                });
                summaries.push(summary);

            }
            callback();
        });
    }, function() {
        onDone(summaries);
    });
}



module.exports = {
    getSummaries: getSummaries
}
