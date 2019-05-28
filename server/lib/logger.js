const path = require('path');
//const winston = require('winston');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const tsFormat = () => new Date().toUTCString();
const myFormat = printf(info => {
  return `${tsFormat()} ${info.label} ${info.level.toUpperCase()}: ${info.message}`;
});

class log {
  constructor(id) {
    this.logFilename = path.join('./log/' + id.toString() + '.log');
    this.logger = createLogger({
      format: combine(label({ label: ':' }), timestamp(), myFormat),
      transports: [
        new transports.Console(),
        new transports.File({
          filename: this.logFilename,
          timestamp: tsFormat
        })
      ]
    });
    this.logger.exitOnError = false;
    console.log(this.logFilename);
  }
  /////Functions for different updates
}

const logger = createLogger({
  format: combine(label({ label: ':' }), timestamp(), myFormat),
  transports: [
    new transports.File({
      filename: `./default.log`,
      timestamp: tsFormat
    })
  ]
});
logger.exitOnError = false;

module.exports = log;
