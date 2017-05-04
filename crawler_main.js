/* 
 * Project path: C:\Users\nyc-PC\Documents\GitHub\crawler
 * Run this file cmd: node crawler_main.js || node task_handler.js 
 * 
 */

// Flag for system initialization
//var isCrawlInitiated = false;

// Delay a promise a specified amount of time
var delay = require('delay');
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
// After the connection with a webpage is established we will download its bosy to this var
//var webpage_body;
//--------------------------------------------------------------

/**
 * This is the main function of this file
 */
function crawl() {
    var reconnect_attempts = 5;

    if (config !== undefined || config.sites !== undefined) {
        for (i = 0; i < config.sites.length; i++) {
            crawl__establish_connection_then_parse((reconnect_attempts - 1), i);
        }
    } else {
        log__to_console_and_file('e', 'g', 'Error in config.jason file');
    }
}

/**
 * Function used for establishing the connection between webpages from config.json and this application
 * reconnect_attempts should be grater or equal to 0 !
 */
function crawl__establish_connection_then_parse(reconnect_attempts, url_no) {
    // Array with URLs wanted to be accessed. - not really needed
    var url = new URL(config.sites[url_no].url);
    var baseUrl = url.protocol + "//" + url.hostname;

    request(baseUrl, function(error, response, body) {
        // Check status code (200 is HTTP OK)
        // Read about status code: https://www.addedbytes.com/articles/for-beginners/http-status-codes/
        if (reconnect_attempts >= 0 && (response === undefined || response.statusCode !== 200)) {
            delay(1000)
                .then(() => {
                    // Executed after 1000 milliseconds
                    log__to_console_and_file('e', '', 'Attempt to reconnect to ' + baseUrl);
                    crawl__establish_connection_then_parse(--reconnect_attempts, url_no);
                });
        } else if (reconnect_attempts < 0 && (response === undefined || response.statusCode !== 200)) {
            log__to_console_and_file('e', '', 'Failed to connect to ' + baseUrl);
        } else if (response !== undefined && response.statusCode === 200) {
            log__to_console_and_file('i', '', 'status code: ' + response.statusCode + ' on ' + baseUrl);
            // Now that the connection is established, we'll parse the webpage's body
            switch (url.host) {
                case 'www.emag.ro':
                    crawl__parse_emag(body);
                    break;
                case 'www.pcgarage.ro':
                    crawl__parse_pcgarage(body);
                    break;
                default:
                    break;
            }
        }
    });
}

/**
 * Specific function for www.emag.ro crawling
 */
function crawl__parse_emag(body) {
    // www.emag.ro returns 500 for some reason
}

/**
 * Specific function for www.pcgarage.ro crawling
 */
function crawl__parse_pcgarage(body) {
    // Parse the document body
    var $ = cheerio.load(body);
    //$('#fruits').children('.pear').text();
}

/**
 * This function will be used to print logs into console or/and in crawler_main.log
 * @param {*Log type} log_type 
 * @param {*The web page used} page 
 * @param {*The message which will be shown} message 
 */
function log__to_console_and_file(log_type, page, message) {
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

    //console.log(message);
}

/**
 * Export constructors
 */
module.exports = crawl;

crawl();