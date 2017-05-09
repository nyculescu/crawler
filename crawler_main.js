/* 
 * Project path: C:\Users\nyc-PC\Documents\GitHub\crawler
 * Run this file cmd: node crawler_main.js || node task_handler.js 
 * 
 * @todo Read about https://www.npmjs.com/package/robotjs - is more like an autoclicker
 * @todo Read about https://2captcha.com/recaptchav2_eng_instruction - how to pass ReCaptcha V2
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
var config_pcgarage = require('./pages/config_pcgar.json'); //@todo to be renamed!
var config_emag = require('./pages/config_emg.json'); //@todo to be renamed!
// Global variable used for write into a file log - can be made local var in the future
var logger;

//--------------------------------------------------------------
// After the connection with a webpage is established we will download its bosy to this var
//var webpage_body;
//--------------------------------------------------------------

var crawl__pcgarage_cnt = 0;
var crawl__emag_cnt = 0;
var crawl__call_interval_pcgarage;
var crawl__call_interval_emag;

/**
 * This is the main function of this file
 */
function crawl__main() {
    var interval = 2000; //2 seconds

    if (crawl__check_config_files()) {
        setTimeout(function() {
            crawl__call_interval_pcgarage = setInterval(function() {
                crawl__pcgarage_cnt++;

                if (crawl__pcgarage_cnt < config_pcgarage.groups.length) {
                    crawl__establish_connection_then_parse(config_pcgarage.name, config_pcgarage.url + config_pcgarage.groups[crawl__pcgarage_cnt].url, config_pcgarage.groups[crawl__pcgarage_cnt].product_type);
                } else {
                    clearInterval(crawl__call_interval_pcgarage);
                }
            }, interval);
        }, 0);

        /*setTimeout(function() {
            crawl__call_interval_emag = setInterval(function() {
                crawl__emag_cnt++;

                if (crawl__emag_cnt < config_emag.groups.length) {
                    crawl__establish_connection_then_parse(config_pcgarage.name, config_pcgarage.url + config_pcgarage.groups[crawl__emag_cnt].url, config_pcgarage.groups[crawl__emag_cnt].product_type);
                } else {
                    clearInterval(crawl__call_interval_emag);
                }
            }, interval);
        }, 500);*/
    }
}

/**
 * Function used for establishing the connection between webpages from config_pcgarage.json and this application
 * reconnect_attempts should be grater or equal to 0 !
 */
function crawl__establish_connection_then_parse(domain_name, base_url, product_type) {
    axios.get(base_url).then((response) => {
            let $ = cheerio.load(response.data);
            let price_list = [];
            let x = 0;

            switch (domain_name) {
                case 'pcgarage':
                    price_list = crawl__parse_pcgarage($, product_type);
                    break;
                case 'emag':
                    price_list = crawl__parse_emag($, product_type);
                    break;
                default:
                    LOG__to_console_and_file('e', 'g', 'Error in config_' + domain_name + '.jason file | 3');
                    break;
            }
            return (price_list);
        })
        .then((price_list) => {
            LOG__to_console_and_file('i', domain_name, price_list);
        })
        .catch(function(error) {
            let error_msg;
            if (error.response) {
                error_msg = 'Connection error with ' + error.config.url + '. Status: ' + error.response.status;
            } else {
                // Something happened in setting up the request that triggered an Error 
                error_msg = 'Connection error with ' + error.config.url;
            }
            LOG__to_console_and_file('e', domain_name, error_msg + ' | ' + error.message);
        });
}

/**
 * Specific function for www.emag.ro crawling
 * EMAG detect when a big activity is made from a specific IP ! @todo Add a proxy connection to this site
 */
function crawl__parse_emag($, product_type) {
    /*let price_list = [];

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

    return (price_list);*/
}

/**
 * Specific function for www.pcgarage.ro crawling
 * This function will parse the content of www.pcgarage.ro and crawl for specific objects
 * We will use config_pcgarage.json to know for what are we looking for
 * To parse the content we will use XPath & Cheerio
 */
function crawl__parse_pcgarage($, product_type) {
    let price_list = [];
    let x = 0;

    //Check if it's in the shop's stock     //*[@id="listing-right"]/div[3]/div[5]/div/div[3]/div[4]
    $('.pb-availability', '#listing-right').each((i, elm) => {
        if (price_list[x] === undefined)
            price_list[x] = [];

        if ($(elm).text().includes('In stoc furnizor')) {
            price_list[x][3] = 'on stock: ' + 'yes';
        } else if ($(elm).text().includes('Nu este in stoc')) {
            price_list[x][3] = 'on stock: ' + 'no';
        } else {
            price_list[x][3] = 'read error';
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the stock availablity failed');
            //return;
        }
        x++;
    });

    x = 0;
    $('.pb-name', '#listing-right').each((i, elm) => {
        if (price_list[x] === undefined)
            price_list[x] = [];

        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[2]/div[1]/a
        price_list[x][0] = 'product: ' + $(elm).children().first().attr('href');

        x++;
    });

    x = 0;
    $('.pb-price', '#listing-right').each((i, elm) => {
        if (price_list[x] === undefined)
            price_list[x] = [];

        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[3]/div[1]
        price_list[x][1] = 'price: ' + $(elm).children().first().text().replace(/[^0-9.,]/gi, '');
        price_list[x][2] = 'currency: ' + $(elm).children().text().replace(/[^a-zA-Z]/gi, '');

        price_list[x][4] = product_type;

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
function LOG__to_console_and_file(log_type, page, message) {
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
}

function crawl__check_config_files() {
    var return_check = false;

    // PC-garage
    if (config_pcgarage !== undefined || config_pcgarage.name !== undefined || config_pcgarage.url !== undefined || config_pcgarage.groups !== undefined) {
        var i = 0;
        while (i < config_pcgarage.groups.length) {
            if (config_pcgarage.groups[i].product_type !== undefined ||
                config_pcgarage.groups[i].name !== undefined ||
                config_pcgarage.groups[i].url !== undefined ||
                config_pcgarage.groups[i].first_page_format !== undefined ||
                config_pcgarage.groups[i].second_page_format !== undefined) {
                return_check = true;
            } else {
                LOG__to_console_and_file('e', 'g', 'Error in config_pcgarage.jason file | 2');
                return false;
            }

            i++;
        }
    } else {
        LOG__to_console_and_file('e', 'g', 'Error in config_pcgarage.jason file | 1');
        return false;
    }

    //Emag
    if (config_emag !== undefined || config_emag.name !== undefined || config_emag.url !== undefined || config_emag.groups !== undefined) {
        var i = 0;
        while (i < config_emag.groups.length) {
            if (config_emag.groups[i].product_type !== undefined ||
                config_emag.groups[i].name !== undefined ||
                config_emag.groups[i].url !== undefined ||
                config_emag.groups[i].first_page_format !== undefined ||
                config_emag.groups[i].second_page_format !== undefined)
                return_check &= true;
            else {
                LOG__to_console_and_file('e', 'g', 'Error in config_emag.jason file | 2');
                return false;
            }

            i++;
        }
    } else {
        LOG__to_console_and_file('e', 'g', 'Error in config_emag.jason file | 1');
        return false;
    }

    return return_check;
}

/**
 * Export constructors
 */
module.exports = crawl__main;

crawl__main();