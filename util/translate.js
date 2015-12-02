var request = require('request');
var async = require('async');

var translate = function function_name(q, languages, cback) {
    var s = q;
    var sourceText = s.replace(/#/g, "").replace(/&/g, "");

    var postTranslatedQ = [];

    async.each(languages, function(language, callback) {
        var targetLang = language;

        var url = "https://translate.google.com/translate_a/single?client=t&sl=auto&tl=" + language + "&hl=en&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&source=btn&ssel=0&tsel=0&kc=0&tk=691553.829799&q=" + encodeURI(sourceText);

        var result = request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var r = JSON.parse(body.replace(/,,,/g, ",").replace(/,,/g, ",").replace(/\[,/g, "["));
                postTranslatedQ.push(r[0][0][0]);                
                callback();
            }
        })
    }, function(err) {
        // if any of the file processing produced an error, err would equal that error
        if (err) {
            // One of the iterations produced an error.
            // All processing will now stop.
            console.log('A file failed to process');
        } else {
            cback(postTranslatedQ);
        }
    });
}


module.exports = translate;
