var DDG = require("node-ddg-api").DDG;
var async = require("async");

var ddg = new DDG('quaerere-app');

var getSummaries = function(entities, onDone) {

    var summaries = [];


    async.each(entities, function(entity, callback) {


        ddg.instantAnswer(entity.name, {
            skip_disambig: '0'
        }, function(err, response) {
            var summary;
            if (response.Image || response.AbstractText) {
                summary = {
                    name: entity.name,
                    img: response.Image,
                    title: response.Heading,
                    source: response.AbstractSource,
                    summary: response.AbstractText,
                    url: response.AbstractURL,
                    hasData: true,
                    freq: entity.freq
                }

            } else {
                var summary = {

                    }
                    //no data found, check related topics
                if (response.RelatedTopics && response.RelatedTopics.length) {
                    var topic = response.RelatedTopics[0];

                    summary = {
                        freq: entity.freq,
                        name: entity.name,
                        img: topic.Icon.URL,
                        title: response.Heading,
                        source: response.AbstractSource,
                        summary: topic.Text,
                        url: response.AbstractURL,
                        hasData: true
                    }
                } else {
                    //mark it for later searching at wiki
                    summary = {
                        name: entity.name,
                        freq: entity.freq,
                        hasData: false
                    }
                }
            }
            summaries.push(summary);
            callback();
        });
    }, function() {
        onDone(summaries);
    });

};

module.exports = {
    getSummaries: getSummaries
}
