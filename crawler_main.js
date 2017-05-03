/* 
 * Project path: C:\Users\nyc-PC\Documents\GitHub\crawler
 * Run this file cmd: node crawler_main.js || node task_handler.js 
 */

// Flag for system initialization
var isCrawlInitiated = false;

// Request library is used to make HTTP requests
var request = require('request');
// Cheerio library is used to parse and select HTML elements on the page
var cheerio = require('cheerio');
// URL library is used to parse URL
var URL = require('url-parse');
// Winston library is logging library with support for multiple transports. Ref: https://github.com/winstonjs/winston
var winston = require('winston');
// File I/O is provided by simple wrappers around standard POSIX functions. All the methods have async and sync forms.
var fs = require('fs');
// Parse the config.json file
var config = require('./config.json');
// Global variable used for write into a file log - can be made local var in the future
var logger;

//--------------------------------------------------------------
// Array with URLs wanted to be accessed. - not really needed
var URLs = [];
var START_URL = 'www.emag.ro';
// To keep track of which pages we've visited (so we don't visit them more than once) we used 
// pagesVisited and added the URL to that set when we visited it.
// In the Java version of the web crawler we used a Set<String> (specifically a HashSet<String>)
var pagesVisited = {};
//var numPagesVisited = 0;
// We'll need a place to put all the links that we find on every page, so we'll use pagesToVisit
var pagesToVisit = [];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
//pagesToVisit.push(START_URL);
//--------------------------------------------------------------

/**
 * This is the main function of this file
 */
function crawl() {
    if (!isCrawlInitiated) {
        //First of all, let's get all the sites needed to crawl
        for (i = 0; i < config.sites.length; i++) {
            URLs[i] = config.sites[i].url;
        }
        isCrawlInitiated = true;
    }

    crawl_emag(crawl);
    crawl_pcgarage(crawl);
}

/**
 * Specific function for www.emag.ro crawling
 */
function crawl_emag(callback) {

    request( /*URLs[0]*/ "www.google.ro", function(error, response, body) {
        // Check status code (200 is HTTP OK)
        // Read about status code: https://www.addedbytes.com/articles/for-beginners/http-status-codes/

        if (response === undefined || response.statusCode !== 200) { // www.emag.ro returns 500
            callback();
            return;
        }

        // Parse the document body
        var $ = cheerio.load(body);
        //$('#fruits').children('.pear').text();
    });
}

/**
 * Specific function for www.pcgarage.ro crawling
 */
function crawl_pcgarage(callback) {

}

/**
 * This function will be used to print logs into console or/and in crawler_main.log
 * @param {*Log type} log_type 
 * @param {*The web page used} page 
 * @param {*The message which will be shown} message 
 */
function print_to_console_and_logfile(log_type, page, message) {
    //If the logger is not instantiated then a new one will be created
    if (logger === undefined) {
        // By default, only the Console transport is set on the default logger. 
        logger = new(winston.Logger)({
            transports: [
                new(winston.transports.Console)(),
                new(winston.transports.File)({ filename: "crawler_main.log" })
            ]
        });
    }

    switch (page) {
        case "emag":
            message = 'EMAG | ' + message;
            break;
        case "pcgarage":
            message = 'PC-GARAGE | ' + message;
            break;
        case "g":
        default:
            message = 'GENERAL | ' + message;
            break;
    }

    switch (log_type) {
        case "e":
            logger.error(message);
            break;
        case "i":
            logger.info(message);
            break;
            /*case "d":
                logger.debug(message);
                break;*/
            //I don't know the reason, but this doesn't work
            /*case "v":
                logger.verbose(message);
                break;*/
            //I don't know the reason, but this doesn't work
        case "w":
            logger.warn(message);
            break;
            /*case "s":
                logger.silly(message);
                break;*/
            //I don't know the reason, but this doesn't work
        default:
            logger.error("Error in log function | Incorrect printing to the log file");
            break;
    }

    console.log(message);
}

/**
 * Export constructors
 */
module.exports = crawl;

crawl();