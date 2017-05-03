/**
 * MDW-n - this Method Doesn't Work - no. of ref."
 */

var Repeat = require("repeat");

/**
 * This will load the "crawler_main" module
 * and create an object of class CrawlerMain
 */
var CrawlerMain = require('./crawler_main.js');
var crawler_main = new CrawlerMain(); //MDW-0

//var concurrently = require("concurrently"); //concurrently cannot be downloaded as package through npm

/**
 * TBD
 */
/*
var repeat = Repeat(function() {
        var crawler_main = new CrawlerMain(); //MDW-0. Only when it's instantiated the function crawl will be called
        //crawler_main.crawl; //MDW-0. Calling this way, the function crawl will be never called
        crawler_main = undefined; //MDW-0. We have to send this object to garbage collector
    })
    .every(1, 's')
    //.while(function(counter) {  return counter <= 5; }) 
    .for(5, 's')
    .start();

repeat.then(function() { console.log('Resolved!'); });
repeat.fail(function() { console.log('Rejected!'); });
repeat.always(function() { console.log('Job done! (either resolved or rejected)'); });
*/


/*
function main_crawler() {
    crawler_main.crawl;
    console.log(i++);
};

repeat(main_crawler).every(500, 'ms').for(1, 'minutes').start.now();
*/

//crawler_main.crawl;