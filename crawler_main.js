/* 
 * Project path: C:\Users\nyc-PC\Documents\Workspace\web_crawler_t
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

var fs = require('fs');

var config = require('./config.json');

var URLs;

var logger;

/**
 * This is the main function of this file
 */
function crawl() {
    print_to_console_and_logfile("d", "G", "crawl function");
}

/**
 * This function will be used to print logs into console or/and in ./log/Log_crawler_
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
                new(winston.transports.File)({ filename: 'log_crawler.log' })
            ]
        });
    }

    switch (page) {
        case "emag":
            message = "EMAG | " + message;
            break;
        case "pcgarage":
            message = "PC-GARAGE | " + message;
            break;
        case "G":
        default:
            message = "GENERAL | " + message;
            break;
    }

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

    //console.log(message);
}

/**
 * Export constructors
 */
module.exports = crawl;

crawl();