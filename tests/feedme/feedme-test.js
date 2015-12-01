var feeds = require('feedme');
var request = require("request");

var parser = new feeds(true);


var result = request('https://news.google.com/news/section?q=apple&output=rss', function(error, response, body) {
    if (!error && response.statusCode == 200) {
        parser.write(body);
    }
});

parser.on('title', function(title) {
    console.log('title of feed is', title);
});
parser.on('item', function(item) {
    console.log(item);
});