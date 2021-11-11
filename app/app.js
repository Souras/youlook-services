var request = require('request');
var rp = require('request-promise');
var deferred = require('deferred');
var CircularJSON = require('circular-json');

module.exports = {
    hello: function() {
        console.log("I am hello in master: ");
    },

    limitToCountWords: function(str, wordsCount) {
        var strArr = str.split(" ");
        var combineStr = "";
        var len = strArr.length > wordsCount ? wordsCount : strArr.length;
        for (var i = 0; i < len; i++) {
            combineStr += " " + strArr[i];
        }
        return combineStr + "...";
    },

    removeHTMLTags: function(containerEle, ele) {
        for (var j = 0; j < ele.length; j++) {
            // let $ele = document.createElement("div");
            // $ele.innerHTML = htmkString;
            // var tags = $ele.getElementsByTagName(ele[j]);
            var tags = containerEle.getElementsByTagName(ele[j]);
            var tagsLength = tags.length;
            for (var i = 0; i < tagsLength; i++) {
                if (typeof tags[0] != "undefined")
                    tags[0].remove();
            }
        }
    },

    reduceImageSize: function(imgUrl, siteIndex, feedIndex) {
        var def = deferred();
        rp("http://api.resmush.it/ws.php?img=" + imgUrl + "&qlty=50").then(function(res) {
                // Process html like you would with jQuery...
                //  console.log("reduceImageSize:- " + res);
                var res = JSON.parse(res);
                res.siteIndex = siteIndex;
                res.feedIndex = feedIndex;
                def.resolve(res);
            })
            .catch(function(err) {
                // Crawling failed or Cheerio choked...
                //  console.log("reduceImageSize Err:- " + err);
                var err = JSON.parse(CircularJSON.stringify(err));
                def.reject(err);
            });
        return def.promise;
        // rp("http://api.resmush.it/ws.php?img=" + imgUrl + "&qlty=50", function(err, res, body) {
        //     if (!err)
        //         console.log("reduceImageSize:- " + body);
        //     else {
        //         console.log("reduceImageSize Err:- " + err);
        //         return false;
        //     }
        // });

        // return this.http.get("http://api.resmush.it/ws.php?img=" + imgUrl + "&qlty=50").map(
        //     res => res.json()
        // );
    },
    listOfSites: function() {
        var feedSites = [{
                url: "http://codekeen.blogspot.com/feeds/posts/default?alt=rss",
                name: "Code Keen",
                imageOptimization: false,
                id: 1
            },
            {
                url: "http://www.glamourmagazine.co.uk/rss/article/",
                name: "Glamour",
                imageOptimization: false,
                id: 2
            },
            {
                url: "http://www.allure.com/rss",
                name: "allure",
                imageOptimization: true,
                id: 3
            },
            {
                url: "http://www.beautyinsider.ru/feed/",
                name: "Beauty Insider",
                imageOptimization: true,
                id: 4
            }

        ]
        return feedSites;
    }

}