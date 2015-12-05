var wiki = require('node-wikipedia');
var cheerio = require('cheerio');
var async = require('async');

//image, title, description, url
function getSummaries(entities, onDone) {

    var summaries = [];

    async.each(entities, function(entity, callback) {
        if (!entities.hasData) {
            wiki.page.data(entity, {
                content: true
            }, function(response) {
                if (response) {
                    $ = cheerio.load(response.text["*"]);
                    entity = {
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
                        entity.img = "https://" + self.find("img").attr("src");
                        entity.summary = self.next().text().slice(0, 150);
                    });
                }
            });
        }

        callback();
    }, function() {
        onDone(entities);
    });
}



module.exports = {
    getSummaries: getSummaries
}
