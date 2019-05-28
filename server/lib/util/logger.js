const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

const tsFormat = () => new Date().toUTCString();
const myFormat = printf(info => {
  return `${tsFormat()} ${info.label} ${info.level.toUpperCase()}: ${
    info.message
  }`;
});
const logger = createLogger({
  format: combine(label({ label: ":" }), timestamp(), myFormat),
  transports: [
    new transports.File({
      filename: `./default.log`,
      timestamp: tsFormat
    })
  ]
});
logger.exitOnError = false;

module.exports = { logger: logger };
