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
//var axios = require('axios');
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
var product_struct = function() {
    this.product_type;
    this.product_link;
    this.price;
    this.currency;
};
var product_list = [];

var crawl__call_interval_pcgarage;
var crawl__call_interval_emag;

/**
 * This is the main function of this file
 */
function crawl__main() {
    var interval = 2000; //2 seconds
    var crawl__pcgarage_cnt = 0;
    var crawl__emag_cnt = 0;

    if (crawl__check_config_files()) {
        setTimeout(function() {
            crawl__call_interval_pcgarage = setInterval(function() {
                crawl__pcgarage_cnt++;

                if (crawl__pcgarage_cnt < config_pcgarage.groups.length) {
                    crawl__establish_connection_then_parse(
                        config_pcgarage.name,
                        config_pcgarage.url + config_pcgarage.groups[crawl__pcgarage_cnt].url,
                        config_pcgarage.groups[crawl__pcgarage_cnt].product_type
                    );
                } else
                    clearInterval(crawl__call_interval_pcgarage);

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

    //Print the products after a certain time 
    //@todo To be replaced
    setTimeout(function() {
        if (product_list !== undefined) {
            for (var i = 0; product_list.length; i++) {
                if (product_list[i] !== undefined) {
                    for (var j = 0; j < product_list[i].length; j++) {
                        if (product_list[i][j].product_type !== undefined ||
                            product_list[i][j].product_link !== undefined ||
                            product_list[i][j].price !== undefined ||
                            product_list[i][j].currency !== undefined) {
                            var toLog = '"product_list" = ' + '{ ' +
                                '"id":"[' + i + '][' + j + ']", ' +
                                '"product_type":"' + product_list[i][j].product_type + '", ' +
                                '"product_link":"' + product_list[i][j].product_link + '", ' +
                                '"price":"' + product_list[i][j].price + '", ' +
                                '"currency":"' + product_list[i][j].currency + '" }'
                            LOG__to_console_and_file('i', 'g', toLog);
                        }
                    }
                }
            }
        }
    }, 5000);
}

/**
 * Function used for establishing the connection between webpages from config_pcgarage.json and this application
 * reconnect_attempts should be grater or equal to 0 !
 */
function crawl__establish_connection_then_parse(domain_name, base_url, product_type /*, pcgarage_cnt*/ ) {
    request(base_url, function(err, resp, body) {
        if (err) {
            LOG__to_console_and_file('e', domain_name, 'Error in establishing the connection for ' + base_url + ' | ' + 'error: ' + err);
            return;
        } else {
            if (resp.statusCode === 200) {
                switch (domain_name) {
                    case 'pcgarage':
                        product_list.push(crawl__parse_pcgarage(cheerio.load(body), product_type, base_url));
                        break;
                    case 'emag':
                        product_list.push(crawl__parse_emag(cheerio.load(body), product_type, base_url));
                        break;
                    default:
                        LOG__to_console_and_file('e', domain_name, 'Error in config_' + domain_name + '.jason file | 3');
                        return;
                }
            } else
                LOG__to_console_and_file('e', domain_name, 'Error in establishing the connection for ' + base_url + ' | ' + 'response: ' + resp.statusCode);
            return;
        }
    });
}

/**
 * Specific function for www.emag.ro crawling
 * EMAG detect when a big activity is made from a specific IP ! @todo Add a proxy connection to this site
 */
function crawl__parse_emag($, product_type) {
    /*let product_list = [];

    let x = 0;
    //*[@id="products-holder"]/div[2]/form/div[2] // a href
    $('.middle-container', '#products-holder').each((i, elm) => {
        product_list[x] = [];
        product_list[x][0] = 'product: ' + $(elm).children().first().children().first().attr('href');
        x++;
    });

    x = 0;
    //*[@id="pret2"]/div/div[1]/div/span[3]/span[1] // money-int
    //*[@id="pret2"]/div/div[1]/div/span[3]/span[2] // money-currency
    $('.price-over', '#pret2').each((i, elm) => {
        product_list[x][1] = 'price: ' + $(elm).children().first().text();
        product_list[x][2] = 'currency: ' + $(elm).children().eq(2).text();
        x++;
    });

    return (product_list);*/
}

/**
 * Specific function for www.pcgarage.ro crawling
 * This function will parse the content of www.pcgarage.ro and crawl for specific objects
 * We will use config_pcgarage.json to know for what are we looking for
 * To parse the content we will use XPath & Cheerio
 */
function crawl__parse_pcgarage($, prod_type, base_url) {
    var price_l = [];

    //*[@id="listing-right"]/div[3]/div[1]/div/div[2]/div[1]/a
    $('.pb-name', '#listing-right').each((i, elm) => {
        price_l[i] = new product_struct();

        price_l[i].product_type = prod_type;

        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[2]/div[1]/a
        if ($(elm).children().first().attr('href'))
            price_l[i].product_link = $(elm).children().first().attr('href');
        else {
            price_l[i].product_link = undefined;
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'product link' + ' failed on: ' + base_url);
        }
    });

    //*[@id="listing-right"]/div[3]/div[2]/div/div[3]/div[1]/p
    $('.pb-price', '#listing-right').each((i, elm) => {
        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[3]/div[1]
        if ($(elm).children().first().text())
            price_l[i].price = $(elm).children().first().text().replace(/[^0-9.,]/gi, '');
        else {
            price_l[i].price = undefined;
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'price' + ' failed on: ' + base_url);
        }

        if ($(elm).children().text())
            price_l[i].currency = $(elm).children().text().replace(/[^a-zA-Z]/gi, '');
        else {
            price_l[i].currency = undefined;
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'currency' + ' failed on: ' + base_url);
        }
    });

    return (price_l);
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
//app.listen(8000);