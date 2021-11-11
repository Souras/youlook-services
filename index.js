'use strict';
var express = require('express');
var url = require('url');
var app = express();
var path = require('path');
var bodyParser = require('body-parser'); // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT
var http = require('http');
var request = require('request');
var util = require("util");
var prettyjson = require('prettyjson');
var internalFunc = require('./app/app');
var cheerio = require('cheerio');
var CircularJSON = require('circular-json');
//var document = require('html-element').document;
// var lwip = require('lwip');
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users
app.use(bodyParser.urlencoded({ 'extended': 'true' })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());


var homeFeed = {}; //To set global feed for home page.
app.get('/test', function(req, res) {

    var $ = cheerio.load('<h2 class="title">Hello world</h2>');
    $('h2.title').text('Hello there!');
    $('h2').addClass('welcome');
    $.html();
    console.log("dddd:- ", $.text())



    // obtain an image object:
    // lwip.open('https://media.licdn.com/media/AAEAAQAAAAAAAANbAAAAJDE5NjBkNDk1LTY3ZGQtNDA0NS04YTJiLTdkNmU3NjZiNjI3Mg.png', function(err, image) {


    //     // check err...
    //     // define a batch of manipulations and save to disk as JPEG:
    //     image
    //     //  .scale(0.75) // scale to 75%
    //     //   .rotate(45, 'white') // rotate 45degs clockwise (white fill)
    //     // .crop(200, 200) // crop a 200X200 square from center
    //     //  .blur(5) // Gaussian blur with SD=5
    //         .resize(200, 200, "grid")
    //         .writeFile('output.jpg', function(err) {
    //             // check err...
    //             // done.
    //             console.log("Errrr:- ", err);
    //         });

    // });

    res.send('<html><body><h1>..</h1></body></html>');
}); -

app.get('/homefeed', function(req, res) {
    res.send(homeFeed);
    //http://www.gettyimages.co.uk.rsz.io/gi-resources/images/Embed/new/embed2.jpg?width=50
    // var parsedUrl = url.parse("http://www.gettyimages.co.uk/gi-resources/images/Embed/new/embed2.jpg");
    //  var host = parsedUrl.protocol + "//" + parsedUrl.host + ".rsz.io" + parsedUrl.path + "?width=100";
});




function prefetchHomeFeed() {
    var feedSites = internalFunc.listOfSites();

    var resultObj = [],
        counter = 0;

    console.log("-----------------------------------------------------------------------");

    function manupulateResult(res) {
        for (var index in res) {
            var obj = res[index].items;
            for (var i in obj) {
                var item = obj[i]
                    //*******To manage the cover Image

                // var $div = document.createElement("div");
                //$div.innerHTML = item.description;
                var ele = cheerio.load(item.description);

                if (!item.coverImg) {
                    //  var imgs = $div.getElementsByTagName("img");
                    var imgs = ele('img');
                    //console.log("imgs:-", imgs);
                    item.imgs = imgs;
                    // console.log("Imgs:-", imgs);
                    if (imgs.length) {
                        item.coverImg = imgs[0].attribs.src;
                        item.isCoverImg = true;
                    } else {
                        // item.coverImg = "../../assets/img/default-title.png";
                        item.coverImg = '../assets/img/default-title.png';
                        item.isCoverImg = false
                    }

                    //To remove all images form description   
                    var imgsLenght = imgs.length;
                    for (var i = 0; i < imgsLenght; i++) {
                        if (typeof imgs[i] != "undefined")
                            imgs[i];
                    }
                }

                if (item.thumbnail) {
                    if (item.thumbnail.url) {
                        item.coverImg = item.thumbnail.url;
                        item.isCoverImg = true;
                    }
                }

                //*******To manage Author
                item.author = (item.author || item.creator || "").substring(0, 10);

                //*******To manage Author
                item.dateTime = item.updated || item.pubDate || "";

                item.isRead = false;
                item.isNew = true;
                item.siteName = res[index].name;
                item.description = ele.html();
                item.shortDescription = internalFunc.limitToCountWords(ele.text().trim(), 25);
            }
        }
        return res;
    }

    function sendResult(obj) {
        var manupulatedResult = manupulateResult(obj);
        fn_reduceImagesSize(manupulatedResult);

    }

    for (var i = 0; i < feedSites.length; i++) {
        (function(obj, whoCalled) {
            //  var YUIFeedUrl = "http://query.yahooapis.com/v1/public/yql?format=json&q=select * from rss(0,4) where url = '" + obj.url + "'| sort(field='pubDate', descending='true')";
            var YUIFeedUrl = "http://query.yahooapis.com/v1/public/yql?format=json&q=select * from rss where url = '" + obj.url + "'| sort(field='pubDate', descending='true')";
            // console.log("YUIFeedUrl:- " + YUIFeedUrl);
            request(YUIFeedUrl, function(error, response, body) {
                ++counter;
                if (!error && response.statusCode == 200) {
                    var jsonObj = JSON.parse(body);
                    if (jsonObj.query.count != 0) {

                        var items = jsonObj.query.results.item;
                        var itemsArr = [];

                        if (items.length > 0) {
                            for (var index in items) {
                                itemsArr.push(items[index]);
                            }
                        } else {
                            itemsArr.push(items);
                        }
                        var feedArr = {
                            name: obj.name,
                            isImgOptimize: obj.imageOptimization,
                            url: obj.url,
                            id: obj.id,
                            items: itemsArr,
                            readFeedCount: 0,
                            newFeedCounter: 0,
                            totalFeeds: itemsArr.length
                        }
                        resultObj = resultObj.concat(feedArr);
                        //console.log("resultObj:- ", feedArr);
                        //console.log(util.inspect(jsonObj), { showHidden: false, depth: null });
                        // var options = {
                        //     noColor: false
                        // };
                        // console.log(prettyjson.render(jsonObj, options));

                        //var z = Object.keys(feedSites).indexOf(obj);
                        console.log("Who called " + whoCalled + " index:- " + obj.id + " feedSites.length: -" + feedSites.length + " counter: -" + counter);
                        console.log("Site URL:- " + obj.name + " items " + jsonObj.query.count);
                        if (feedSites.length === counter) {
                            console.log("result length: " + resultObj.length);
                            sendResult(resultObj);
                        }
                    }
                } else {
                    console.log("Failed to fetch rss. Site Name:- " + obj.name);
                }
            })
        })(feedSites[i], i + 1);
    }



};

function fn_reduceImagesSize(res) {
    var byPass = true;
    if (byPass === false) {
        var tracker = 0;
        var allFeedLength = 0;
        for (var index in res) {
            if (res[index].isImgOptimize === true) {
                allFeedLength += res[index].items.length;
                var obj = res[index].items;
                for (var i = 0; i < obj.length; i++) {
                    if (obj[i].isCoverImg === true) {
                        internalFunc.reduceImageSize(obj[i].coverImg, parseInt(index), i).then(function(data) {
                            tracker++;
                            // var data = JSON.parse(data);
                            var innerObj = res[data.siteIndex].items[data.feedIndex];
                            if (typeof data.error === "undefined") {
                                innerObj.coverImg = data.dest;
                                console.log("Reduce Img:-", innerObj.siteName, data.dest);
                            } else {
                                console.log("reduce Img error:-", innerObj.siteName, data.error_long);
                            }
                            if (tracker === allFeedLength) {
                                var responseObj = {
                                    query: {
                                        results: {
                                            item: res
                                        }
                                    }
                                };
                                homeFeed = CircularJSON.stringify(responseObj);
                                console.log("Image Resize not ByPass:- " + byPass);
                            }
                        });
                    } else {
                        tracker++;
                    }
                }
            }
        }
    } else {
        var responseObj = {
            query: {
                results: {
                    item: res
                }
            }
        }
        homeFeed = CircularJSON.stringify(responseObj);
        console.log("Image Resize ByPass:- " + byPass);
    }
}
prefetchHomeFeed();
setInterval(function() {
        prefetchHomeFeed();
    }, 300000)
    // app.get('*', function(req, res) {
    //     res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    // });


// var server = app.listen('4400', function() {
//     var host = server.address().address;
//     var port = server.address().port;
//     console.log("Example app listening at http://%s:%s", host, port)
// });


var server = app.listen(app.get('port'), function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port)
});








// function calcTotalTime() {
//     var timeRows = $($($("#sample-table-1 tr")[1])[0]).find("td");


//     //console.log("Time Obj:- ", timeRows);
//     console.log("Time Obj Lenght:- " + timeRows.length);

//     var totalHours = 0,
//         totalMints = 0,
//         numOfDays = 0;
//     try {
//         for (var item = 0; item < timeRows.length; item++) {
//             //    console.log("item:- ", item);
//             if ($(timeRows[item]).find("span")[2]) {
//                 var txt = $(timeRows[item]).find("span")[2].textContent;
//                 //  console.log("TXT:- ", txt);
//                 if (txt) {
//                     //  var check = txt.search(/["length","Total"]/);
//                     var check = txt.search(/[":"]/);
//                     //  console.log("check:- ", check);
//                     if (check !== -1) {
//                         ++numOfDays;
//                         var split = txt.split(":");
//                         var hours = parseInt(split[0]);
//                         var mints = parseInt(split[1]);
//                         totalHours += hours;
//                         totalMints += mints;
//                         //  console.log("S.no:- " + numOfDays + " item Number:- " + item + " Hours:- " + hours + " mints:- " + mints);
//                     }
//                 }
//             }
//             console.log("Total Hours:- " + totalHours);
//         }
//     } catch (ex) {
//         console.log("Ex: ", ex);
//     }
//     //  console.log("Total Hours:- " + totalHours);
//     //   console.log("Total Mints:- " + totalMints);
//     //  console.log("Number of Days:- " + numOfDays);
//     //  console.log("Total Monthly Hours:- " + (parseInt(totalHours) + parseInt(Math.floor((totalMints / 60), 0))));
//     alert("Total Monthly Hours:- " + (parseInt(totalHours) + parseInt(Math.floor((totalMints / 60), 0))) + "\nNumber of Days:- " + numOfDays);
// }