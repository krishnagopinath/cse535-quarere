var wiki = require('node-wikipedia');
var cheerio = require('cheerio');
var async = require('async');
var _ = require('lodash');

//image, title, description, url
function getSummaries(entities, onDone) {

    var summaries = [];

    async.each(entities, function(entity, callback) {
        if (!entity.hasData) {
            wiki.page.data(entity.name, {
                content: true
            }, function(response) {
                if (response) {

                    $ = cheerio.load(response.text["*"]);
                    entityRevised = {
                        name: entity.name,
                        img: "",
                        title: response.title,
                        source: "Wikipedia",
                        summary: "",
                        url: "https://en.wikipedia.org/?curid=" + response.pageid,
                        hasData: true,
                        freq: entity.freq
                    }

                    $(".infobox").filter(function() {
                        var self = $(this);
                        entityRevised.img = "https://" + self.find("img").attr("src");
                        entityRevised.summary = self.next().text().slice(0, 150);
                    });

                    summaries.push(entityRevised);

                }
                callback();
            });
        } else {
            summaries.push(entity);
            callback();
        }

        
    }, function() {
        onDone(_.sortBy(summaries, "freq").reverse());
    });
}



module.exports = {
    getSummaries: getSummaries
}
