var app = angular.module('quaerere-engine', ['ngRoute', 'ngSanitize']);

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

    $scope.reachLink = function(link) {
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

    $scope.getDocs = function() {
        if ($scope.nextStartCount < $scope.docCount || !$scope.docCount) {
            solrService.getDocs($scope.query, $scope.nextStartCount).then(function(res) {
                console.log($scope.nextStartCount);
                $scope.docCount = res.data.numFound;
                $scope.showInteracts = true;
                $scope.tweets = $scope.tweets.concat(res.data.docs);

                if ($scope.nextStartCount == 0) {
                    $scope.q = res.data.q;
                    $scope.summaries = res.data.summaries;
                }


                $scope.nextStartCount += res.data.docs.length;

            });
        } else {
            //TODO : add of end of docs message at the end.
        }
    }

    msgBus.onMsg('query', function(e, data) {

        $scope.docCount = 0
        $scope.nextStartCount = 0;

        $scope.query = data;

        $scope.getDocs();

        newsService.getNews(data).then(function(res) {
            $scope.showInteracts = true;
            $scope.news = res.data;
        });
    }, $scope);
});

app.filter('truncate', function() {
    return function(text, length, end) {
        if (isNaN(length))
            length = 10;

        if (end === undefined)
            end = "...";

        if (text.length <= length || text.length - end.length <= length) {
            return text;
        } else {
            return String(text).substring(0, length - end.length) + end;
        }

    };
});

app.directive('scrollEnd', function() {
    return {
        restrict: 'A',
        scope: '=',
        link: function(scope, elem, attrs) {
            var raw = elem[0];

            elem.bind('scroll', function() {
                if (raw.scrollTop + raw.offsetHeight + 1 >= (raw.scrollHeight)) {
                    scope.getDocs();
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

app.directive('getBg', function() {
    return {
        restrict: 'A',
        scope: '=',
        link: function(scope, elem, attrs) {
            attrs.$observe('bg', function(value) {
                elem.css('background', 'url(' + value + ')');

            });
        }
    };
})
