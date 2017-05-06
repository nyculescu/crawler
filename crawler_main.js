/* 
 * Project path: C:\Users\nyc-PC\Documents\GitHub\crawler
 * Run this file cmd: node crawler_main.js || node task_handler.js 
 * 
 */

// Flag for system initialization
//var isCrawlInitiated = false;
// Promise based HTTP client for the browser and node.js
var axios = require('axios');
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
    if (config !== undefined || config.sites !== undefined) {
        for (i = 0; i < config.sites.length; i++) {
            let domain_name = config.sites[i].name;

            for (j = 0; j < config.sites[i].map.length; j++) {
                crawl__establish_connection_then_parse(domain_name, config.sites[i].url + config.sites[i].map[j].url);
            }
        }
    } else {
        log__to_console_and_file('e', 'g', 'Error in config.jason file | 2');
    }
}

/**
 * Function used for establishing the connection between webpages from config.json and this application
 * reconnect_attempts should be grater or equal to 0 !
 */
function crawl__establish_connection_then_parse(domain_name, base_url) {
    axios.get(base_url).then((response) => {
            let $ = cheerio.load(response.data);
            let price_list = [];
            let x = 0;

            switch (domain_name) {
                case 'pc_garage':
                    price_list = crawl__parse_pcgarage($);
                    break;
                case 'emag':
                    price_list = crawl__parse_emag($);
                    break;
                default:
                    log__to_console_and_file('e', 'g', 'Error in config.jason file | 1');
                    break;
            }
            return (price_list);
        })
        .then((price_list) => {
            console.log(price_list);
        })
        .catch(function(error) {
            let error_msg;
            if (error.response) {
                error_msg = 'Connection error. Status: ' + error.response.status;
            } else {
                // Something happened in setting up the request that triggered an Error 
                error_msg = 'Connection error. ', error.message;
            }
            console.log(error_msg + ' | ' + error.config.url + ' is ' + error.config.data);
        });
}

/**
 * Specific function for www.emag.ro crawling
 * EMAG detect when a big activity is made from a specific IP ! @todo Add a proxy connection to this site
 */
function crawl__parse_emag($) {
    let price_list = [];

    let x = 0;
    //*[@id="products-holder"]/div[2]/form/div[2] // a href
    $('.middle-container', '#products-holder').each((i, elm) => {
        price_list[x] = [];
        price_list[x][0] = 'product: ' + $(elm).children().first().children().first().attr('href');
        x++;
    });

    x = 0;
    //*[@id="pret2"]/div/div[1]/div/span[3]/span[1] // money-int
    //*[@id="pret2"]/div/div[1]/div/span[3]/span[2] // money-currency
    $('.price-over', '#pret2').each((i, elm) => {
        price_list[x][1] = 'price: ' + $(elm).children().first().text();
        price_list[x][2] = 'currency: ' + $(elm).children().eq(2).text();
        x++;
    });

    return (price_list);
}

/**
 * Specific function for www.pcgarage.ro crawling
 * This function will parse the content of www.pcgarage.ro and crawl for specific objects
 * We will use config.json to know for what are we looking for
 * To parse the content we will use XPath & Cheerio
 */
function crawl__parse_pcgarage($) {
    let price_list = [];
    let x = 0;
    $('.pb-name', '#listing-right').each((i, elm) => {
        price_list[x] = [];
        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[2]/div[1]/a
        price_list[x][0] = 'product: ' + $(elm).children().first().attr('href');
        x++;
    });

    x = 0;
    $('.pb-price', '#listing-right').each((i, elm) => {
        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[3]/div[1]
        price_list[x][1] = 'price: ' + $(elm).children().first().text().replace(/[^0-9.,]/gi, '');
        price_list[x][2] = 'currency: ' + $(elm).children().text().replace(/[^a-zA-Z]/gi, '');
        x++;
    });

    return (price_list);
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