var app = angular.module('quaerere-engine', ['ngRoute']);

app.run(function() {
    componentHandler.upgradeAllRegistered();
});


app.factory('msgBus', function($rootScope) {
    return {
        emitMsg: function(id, data) {
            $rootScope.$emit(id, data ? data : {});
        },

        onMsg: function(id, func, scope) {
            var unbind = $rootScope.$on(id, func);
            if (scope) {
                scope.$on('$destroy', unbind);
            }
        }
    };
});

app.factory('solrService', function($http) {
    return {
        getDocs: function(q, start) {;
            return $http.get('http://192.168.1.187:3000/search', {
                params: {
                    q: q,
                    start: start,
                    rows: 12
                }
            });
        }
    }
});

app.factory('newsService', function($http) {
    return {
        getNews: function(q) {
            return $http.get('http://192.168.1.187:3000/news', {
                params: {
                    q: q
                }
            });
        }
    }
});

app.controller('SearchController', function($scope, msgBus) {
    $scope.sendQuery = function(e, val) {
        if (val) {
            msgBus.emitMsg('typing');
        }
        if (e.which === 13 && val) {
            msgBus.emitMsg('query', val);
        }
    }
});

app.controller('ResultController', function($scope, msgBus, solrService, newsService) {

    $scope.query = '';
    $scope.tweets = [];
    $scope.news = [];
    $scope.showInteracts = false; // TODO : Remove this and use the length of the tweet and news responses
    $scope.showTweets = true;
    $scope.showScrollUpForTweets = false;

    $scope.reachNewsLink = function(link) {
        window.open(link, '_blank');
    }
    $scope.checkEntities = function() {
        return true;
    }
    $scope.getBgImage = function(src) {
        return 'url(' + src + ')';
    }

    msgBus.onMsg('typing', function() {
        $scope.typing = true;
    });

    $scope.getTweets = function() {
        if ($scope.nextStartCount <= $scope.docCount) {
            solrService.getDocs($scope.query, $scope.nextStartCount).then(function(res) {
                console.log($scope.nextStartCount);
                $scope.docCount = res.data.numFound;
                $scope.nextStartCount += res.data.docs.length;
                $scope.showInteracts = true;
                $scope.tweets = $scope.tweets.concat(res.data.docs);
            });
        } else {
            //TODO : add of end of docs message at the end.
        }
    }

    msgBus.onMsg('query', function(e, data) {

        $scope.docCount = 0
        $scope.nextStartCount = 0;

        $scope.query = data;

        $scope.getTweets();

        newsService.getNews(data).then(function(res) {
            $scope.showInteracts = true;
            $scope.news = res.data;
        });
    }, $scope);
});

app.directive('scrollEnd', function() {
    return {
        restrict: 'A',
        scope: '=',
        link: function(scope, elem, attrs) {
            var raw = elem[0];

            elem.bind('scroll', function() {
                console.log(raw.scrollTop + raw.offsetHeight, raw.scrollHeight);
                if (raw.scrollTop + raw.offsetHeight + 1 >= (raw.scrollHeight)) {
                    scope.getTweets();
                }
            });
        }
    };
});

// TODO : fix scrollTop
app.directive('scrollToTop', function() {
    return {
        restrict: 'A',
        scope: '=',
        link: function(scope, elem, attrs) {
            elem.bind("click", function(scope, elem, attrs) {
               window.scrollTo(0, 0);
            });
        }
    };
});
