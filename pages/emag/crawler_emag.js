/* 
 * Project path: C:\Users\nyc-PC\Documents\Workspace\web_crawler
 * Run this file cmd: node crawler_emag.js 
 */

// Request library is used to make HTTP requests
var request = require('request');
// Cheerio library is used to parse and select HTML elements on the page
var cheerio = require('cheerio');
// URL library is used to parse URL
var URL = require('url-parse');
// Winston library is logging library with support for multiple transports. Ref: https://github.com/winstonjs/winston
var winston = require('winston');

// By default, only the Console transport is set on the default logger. 
var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)(),
        new(winston.transports.File)({ filename: 'Log_crawler_emag.log' })
    ]
});

var START_URL = "http://www.emag.ro";
var SEARCH_WORD_0 = "Televizor LED";
// must be searched by html p classes: class="product-old-price" || 
// clasa parinte class="price-over" 
//      clasa child class="money-int" - pretul produsului 
//      clasa child class="money-currency" has to be Lei

var MAX_PAGES_TO_VISIT = 100;

// To keep track of which pages we've visited (so we don't visit them more than once) we used 
// pagesVisited and added the URL to that set when we visited it.
// In the Java version of the web crawler we used a Set<String> (specifically a HashSet<String>)
var pagesVisited = {};
var numPagesVisited = 0;
// We'll need a place to put all the links that we find on every page, so we'll use pagesToVisit
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

pagesToVisit.push(START_URL);
crawl();

function crawl() {
    if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
        print_to_console_and_logfile("e", "Reached max limit of number of pages to visit.");
        return;
    }
    var nextPage = pagesToVisit.pop();
    // Before visiting a page, we make sure that the URL is not already in that set. If it is, we skip it.
    if (nextPage in pagesVisited) {
        // We've already visited this page, so repeat the crawl
        crawl();
    } else {
        // New page we haven't visited
        visitPage(nextPage, crawl);
    }
}

function visitPage(url, callback) {
    // Add page to our set
    pagesVisited[url] = true;
    numPagesVisited++;

    // Make the request
    print_to_console_and_logfile("i", "Visiting page " + url);
    // We use the library request to visit the page and then execute a callback after we get the response. 
    // The callback is the anonymous function that looks like function(error, response, body)
    request(url, function(error, response, body) {
        // Check status code (200 is HTTP OK)
        // Read about status code: https://www.addedbytes.com/articles/for-beginners/http-status-codes/
        print_to_console_and_logfile("i", "Status code: " + response.statusCode);

        if (response.statusCode !== 200) {
            callback();
            return;
        }

        // Parse the document body
        var $ = cheerio.load(body);
        var isWordFound = searchForWord($, SEARCH_WORD_0);
        if (isWordFound) {
            print_to_console_and_logfile("i", 'Word ' + SEARCH_WORD_0 + ' found at page ' + url);

            var html_ = cheerio.load(url);
            html_('div[class=spi-old-price ]').each(function(i, element) {
                var a = $(this).prev();
                print_to_console_and_logfile("i", a.text());
            });

            /*var list = [];
            $('div[class=spi-old-price ]').find('div > div > a').each(function(index, element) {
                list.push($(element).attr('href'));
            });*/

        } else {
            collectInternalLinks($);
            // In this short program, our callback is just calling crawl()
            callback();
            print_to_console_and_logfile("i", "Word " + SEARCH_WORD_0 + " was not found");
        }
    });
}

/**
 * We use the JavaScript function indexOf to check for occurences of a substring in a given string. 
 * Note that indexOf is case sensitive, so we have to convert 
 * both the search word and the web page to either uppercase or lowercase.
 */
function searchForWord($, word) {
    var bodyText = $('html > body').text().toLowerCase();
    return (bodyText.indexOf(word.toLowerCase()) !== -1);
}

/**
 * There are two types of links we'll come across on webpages. Hyperlinks can come as relative paths or absolute paths.
 * Relative paths look like: /information-technology or /gadgets
 * Absolute paths look like: http://www.arstechnica.com/information-technology or http://www.arstechnica.com/gadgets
 * You'll notice that relative paths won't ever lead us away from the domain that we start on. 
 * Absolute paths could take us anywhere on the internet. 
 * 
 * That distinction is important when you're building the web crawler. 
 * Do you want your crawler to stay on the existing website (in this case arstechnica.com) and 
 * search only pages within that domain, or is it acceptable to adventure outside to other websites 
 * such as condenast.com? The code below will gather all of the relative hyperlinks as well as all the 
 * absolute hyperlinks for a given page:
 */
function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    print_to_console_and_logfile("i", "Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}

function print_to_console_and_logfile(log_type, message) {
    console.log(message);

    /* log file posponed for now
        switch (log_type) {
            case "e":
                logger.log("error", message);
                break;
            case "i":
                logger.log("info", message);
                break;
            case "d":
                logger.log("debug", message);
                break;
            default:
                logger.log("error in log function", "incorrect printing to the log file");
                break;
        }
        */
}