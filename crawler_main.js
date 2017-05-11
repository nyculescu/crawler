/* 
 * Project path: C:\Users\nyc-PC\Documents\GitHub\crawler
 * Run this file cmd: node crawler_main.js || node task_handler.js 
 * DB - start mongodb >> mongod --dbpath E:\Projects\crawler_for_online_shops\database
 * 
 * @todo Read about https://www.npmjs.com/package/robotjs - is more like an autoclicker
 * @todo Read about https://2captcha.com/recaptchav2_eng_instruction - how to pass ReCaptcha V2
 */

// Flag for system initialization
//var isCrawlInitiated = false;
// Promise based HTTP client for the browser and node.js
//var axios = require('axios');
// Delay a promise a specified amount of time
//var delay = require('delay');
// URL library is used to parse URL
//var URL = require('url-parse');
// File I/O is provided by simple wrappers around standard POSIX functions. All the methods have async and sync forms.
//var fs = require('fs');
// Request library is used to make HTTP requests
var request = require('request');
// Cheerio library is used to parse and select HTML elements on the page
var cheerio = require('cheerio');
// Winston library is logging library with support for multiple transports. Ref: https://github.com/winstonjs/winston
var winston = require('winston');
// Parse the config.json file
var config_pcgarage = require('./pages/config_pcgar.json'); //@todo to be renamed!
var config_emag = require('./pages/config_emg.json'); //@todo to be renamed!
// Global variable used for write into a file log - can be made local var in the future
var logger;
// The official MongoDB driver for Node.js
var mongo = require('mongodb').MongoClient;
// ?
var http = require('http');

//--------------------------------------------------------------
// After the connection with a webpage is established we will download its bosy to this var
//var webpage_body;
//--------------------------------------------------------------
var product_struct = function() {
    this.group_type
    this.product_type;
    this.product_link;
    this.price;
    this.currency;
};
var product_list = [];

var crawl__call_interval_pcgarage;
var crawl__call_interval_emag;
var crawl__pcgarage_cnt = 0;
var crawl__emag_cnt = 0;

/**
 * This is the main function of this file
 */
function crawl__main() {
    var group_counter_pcgarage = 0;
    var group_counter_emag = 0;
    var interval = 0;
    var delay = 100;

    if (crawl__check_config_files()) {
        //Do the work for pcgarage
        setTimeout(function() {
            if (group_counter_pcgarage < config_pcgarage.groups.length) {
                //crawl__call_interval_pcgarage = setInterval(function () {
                crawl__establish_connection_then_parse(config_pcgarage.name, group_counter_pcgarage);
                group_counter_pcgarage++;
                //}, interval);
            }
        }, delay * 0);

        //Do the work for emag
        setTimeout(function() {
            if (group_counter_emag < config_emag.groups.length) {
                //crawl__call_interval_pcgarage = setInterval(function () {
                //crawl__establish_connection_then_parse(config_emag.name, group_counter_emag);
                group_counter_emag++;
                //}, interval);
            }
        }, delay * 1);

    }

    //Print the products after a certain time 
    //@todo To be replaced
    setTimeout(function() {
        if (product_list !== undefined) {
            for (var i = 0; product_list.length; i++) {
                if (product_list[i] !== undefined) {
                    for (var j = 0; j < product_list[i].length; j++) {
                        if (product_list[i][j].product_type !== undefined ||
                            product_list[i][j].group_type !== undefined ||
                            product_list[i][j].product_link !== undefined ||
                            product_list[i][j].price !== undefined ||
                            product_list[i][j].currency !== undefined) {
                            var toLog = '"product_list" = ' + '{ ' +
                                '"id":"[' + i + '][' + j + ']", ' +
                                '"group_type":"' + product_list[i][j].group_type + '", ' +
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
    }, 30000);
}

/**
 * Function used for establishing the connection between webpages from config_pcgarage.json and this application
 * reconnect_attempts should be grater or equal to 0 !
 */
function crawl__establish_connection_then_parse(pageToCrawl, groupItemsCounter) {
    var interval = 1000; //1 seconds
    var isRequestFailed = false;
    var pageCounter = 1;
    //var pageCounter_pcgarage = 1;

    //Try for the first page
    crawl__call_interval_pcgarage = setInterval(function() {
        if (!isRequestFailed) {
            switch (pageToCrawl) {
                case 'pcgarage':
                    if (pageCounter === 1) //Check if it's the first page
                    //first page format with filters
                        var base_url = 'http://www.pcgarage.ro' + config_pcgarage.groups[groupItemsCounter].url + '/filtre/stoc';
                    else
                    //second page format with filters
                        var base_url = 'http://www.pcgarage.ro' + config_pcgarage.groups[groupItemsCounter].url + '/pagina' + pageCounter + '/filtre/stoc';

                    pageCounter++;

                    //Take each page from each group
                    request(base_url, function(err, resp, body) {
                        if (err) {
                            LOG__to_console_and_file('e', domain_name, 'Error in establishing the connection for ' + base_url + ' | ' + 'error: ' + err);
                        } else {
                            // The connection is OK and the page has content
                            if (resp.statusCode === 200) {
                                let product = crawl__parse_pcgarage(
                                    cheerio.load(body),
                                    config_pcgarage.groups[groupItemsCounter].group_type,
                                    config_pcgarage.groups[groupItemsCounter].product_type,
                                    base_url
                                );
                                if (product)
                                    product_list.push(product);
                            }
                            // The connection is OK but teh page is inexistent
                            else if (resp.statusCode === 404) {
                                LOG__to_console_and_file('e', pageToCrawl, 'Error in establishing the connection for ' + base_url + ' | ' + 'response: ' + resp.statusCode);
                                isRequestFailed = true;
                            }
                            // connetion error
                            else {
                                LOG__to_console_and_file('e', pageToCrawl, 'Error in establishing the connection for ' + base_url + ' | ' + 'response: ' + resp.statusCode);
                            }
                        }
                    });
                    break;
                case 'emag':
                    if (pageCounter === 1) //Check if it's the first page
                    //first page format with filters
                        var base_url = 'http://www.emag.ro' + config_emag.groups[groupItemsCounter].url + '/stoc/c';
                    else
                    //second page format with filters
                        var base_url = 'http://www.emag.ro' + config_emag.groups[groupItemsCounter].url + '/stoc/p' + pageCounter + '/c';

                    pageCounter++;

                    //Take each page from each group
                    request(base_url, function(err, resp, body) {
                        if (err) {
                            LOG__to_console_and_file('e', domain_name, 'Error in establishing the connection for ' + base_url + ' | ' + 'error: ' + err);
                        } else {
                            // The connection is OK and the page has content
                            if (resp.statusCode === 200) {
                                let product = crawl__parse_emag(
                                    cheerio.load(body),
                                    config_pcgarage.groups[groupItemsCounter].group_type,
                                    config_emag.groups[groupItemsCounter].product_type,
                                    base_url
                                );
                                if (product)
                                    product_list.push(product);
                            }
                            // The connection is OK but teh page is inexistent
                            else if (resp.statusCode === 404) {
                                LOG__to_console_and_file('e', pageToCrawl, 'Error in establishing the connection for ' + base_url + ' | ' + 'response: ' + resp.statusCode);
                                isRequestFailed = true;
                            }
                            // connetion error
                            else {
                                LOG__to_console_and_file('e', pageToCrawl, 'Error in establishing the connection for ' + base_url + ' | ' + 'response: ' + resp.statusCode);
                            }
                        }
                    });
                    product_list.push(crawl__parse_emag(cheerio.load(body), product_type, base_url));
                    break;
                default:
                    LOG__to_console_and_file('e', pageToCrawl, 'Error in config_' + pageToCrawl + '.jason file | 3');
                    break;
            }
        } else
            clearInterval(crawl__call_interval_pcgarage);
    }, interval);
}

/**
 * Specific function for www.emag.ro crawling
 * EMAG detect when a big activity is made from a specific IP ! @todo Add a proxy connection to this site
 */
function crawl__parse_emag($, group_type, product_type, base_url) {
    var price_l = [];
    var product;

    //*[@id="pret2"]/div/div[1]/div/span[3]/span[1] // money-int
    //*[@id="pret2"]/div/div[1]/div/span[3]/span[2] // money-currency
    $('.price-over', '#pret2').each((i, elm) => {
        if ($(elm).children().first().text()) {
            product = new product_struct();
            product.product_type = prod_type;
            product.group_type = group_type;
            product.price = $(elm).children().first().text().replace(/[^0-9,]/gi, '');
        } else {
            //price_l[i].price = undefined;
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'price' + ' failed on: ' + base_url);
            return;
        }

        //It's clear that if program will reach to this point, product var it's already initialized
        if ($(elm).children().eq(2).text())
            product.currency = $(elm).children().eq(2).text().replace(/[^a-zA-Z]/gi, '');
        else {
            product.currency = undefined;
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'currency' + ' failed on: ' + base_url);
        }
    });

    //It's clear that if program will reach to this point, product var it's already initialized
    //*[@id="products-holder"]/div[2]/form/div[2] // a href
    $('.middle-container', '#products-holder').each((i, elm) => {
        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[2]/div[1]/a
        if ($(elm).children().first().children().first().attr('href')) {
            product.product_link = $(elm).children().first().children().first().attr('href');
            price_l.push(product);
        } else {
            LOG__to_console_and_file('e', config_emag.name, 'Checking the ' + 'product link' + ' failed on: ' + base_url);
            return;
        }
    });

    var db_emag = "mongodb://localhost:27017/crawl_emag_db";
    mongo.connect(db_emag, function(err, db) {
        if (err) throw err;
        var query = { address: "Park Lane 38" };
        db.collection("customers").find(query).toArray(function(err, result) {
            if (err) throw err;
            console.log(result);
            db.close();
        });
    });
}

/**
 * Specific function for www.pcgarage.ro crawling
 * This function will parse the content of www.pcgarage.ro and crawl for specific objects
 * We will use config_pcgarage.json to know for what are we looking for
 * To parse the content we will use XPath & Cheerio
 */
function crawl__parse_pcgarage($, group_type, prod_type, base_url) {
    var price_l = [];
    var product;

    //*[@id="listing-right"]/div[3]/div[2]/div/div[3]/div[1]/p
    $('.pb-price', '#listing-right').each((i, elm) => {
        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[3]/div[1]
        if ($(elm).children().first().text()) {
            product = new product_struct();
            product.product_type = prod_type;
            product.group_type = group_type;
            product.price = $(elm).children().first().text().replace(/[^0-9,]/gi, '');
        } else {
            //price_l[i].price = undefined;
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'price' + ' failed on: ' + base_url);
            return;
        }

        //It's clear that if program will reach to this point, product var it's already initialized
        if ($(elm).children().text())
            product.currency = $(elm).children().text().replace(/[^a-zA-Z]/gi, '');
        else {
            product.currency = undefined;
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'currency' + ' failed on: ' + base_url);
        }
    });

    //It's clear that if program will reach to this point, product var it's already initialized
    //*[@id="listing-right"]/div[3]/div[1]/div/div[2]/div[1]/a
    $('.pb-name', '#listing-right').each((i, elm) => {
        //*[@id="listing-right"]/div[3]/div[1]/div[2]/div[2]/div[1]/a
        if ($(elm).children().first().attr('href')) {
            product.product_link = $(elm).children().first().attr('href');
            price_l.push(product);
        } else {
            LOG__to_console_and_file('e', config_pcgarage.name, 'Checking the ' + 'product link' + ' failed on: ' + base_url);
            return;
        }
    });

    /**
     *  Sort the products which will go to the database by defined criterias 
     * 
     * */
    var db_pcgarage = "mongodb://localhost:27017/crawl_pcgarage_db";

    mongo.connect(db_pcgarage, function(err, db) {
        if (err) throw err;
        var query = { product_type: "smartphone" };
        db.collection("groups").find(query).toArray(function(err, result) {
            if (err) throw err;
            console.log('--- database: ' + result);
            db.close();
        });
    });
    switch (price_l.group_type) {
        case 'gadget':
            crawl__check_with_database();
            break;
        case 'system_server':
            crawl__check_with_database();
            break;
        case 'home':
            crawl__check_with_database();
            break;
        case 'pc':
            crawl__check_with_database();
            break;
        default:
            break;

    }

    return (price_l);
}

function crawl__check_with_database() {
    //
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
    //Check for database
    var db_emag = "mongodb://localhost:27017/crawl_emag_db";
    var db_pcgarage = "mongodb://localhost:27017/crawl_pcgarage_db";
    mongo.connect(db_emag, function(err, db) {
        if (err) throw err;
        console.log("Database created!");
        db.close();
    });
    mongo.connect(db_pcgarage, function(err, db) {
        if (err) throw err;
        console.log("Database created!");
        db.close();
    });

    var return_check = false;

    // PC-garage
    if (config_pcgarage !== undefined || config_pcgarage.name !== undefined || config_pcgarage.groups !== undefined) {
        var i = 0;
        while (i < config_pcgarage.groups.length) {
            if (config_pcgarage.groups[i].product_type !== undefined ||
                config_pcgarage.groups[i].group_type !== undefined ||
                config_pcgarage.groups[i].url !== undefined) {
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
    if (config_emag !== undefined || config_emag.name !== undefined || config_emag.groups !== undefined) {
        var i = 0;
        while (i < config_emag.groups.length) {
            if (config_emag.groups[i].product_type !== undefined ||
                config_emag.groups[i].group_type !== undefined ||
                config_emag.groups[i].url !== undefined)
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