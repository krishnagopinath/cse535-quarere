var async = require('async');
var AlchemyAPI = require('alchemy-api');

var alchemyapi = new AlchemyAPI("e2f924651620f8471101ef838142332f2b4cd277");

var entities = [];

getEntities = function(q, callback) {

    alchemyapi.entities(q, {}, function(err, response) {
        response.entities.forEach(function(entity) {
            entities.push(entity.type);
            if (entity.disambiguated && entity.disambiguated.subType) {
                entities = entities.concat(entity.disambiguated.subType);
            }
        });

        entities = entities.sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1] && item != undefined;
        });

        //console.log(response);
        callback(entities);
    });

}


module.exports = {
    getEntities: getEntities
}
