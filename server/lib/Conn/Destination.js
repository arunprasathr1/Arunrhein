const Utils = require('./UserAuth');
const url = require('url');
const https = require('https');

const MAX_AGE_IN_MS = 5 * 60 * 1000; // 5 minutes
const HEADER_AUTH = 'Authorization';
const destination = Utils.getServiceByName('destination');

class Route {
  constructor(name, routeDetails) {
    this.path = '/';
    this.target = {
      type: 'destination',
      name: name,
      entryPath: routeDetails['entrypath'],
      method: routeDetails['method'],
      data: routeDetails['data']
    };
  }

  getRegExp() {
    return new RegExp(this.path + '.*');
  }

  getDestination() {
    return loadDestination(this.target.name);
  }
}

var destinationsCache = {};

/*********************************************************
 * Call destination service
 *********************************************************/
function loadDestination(name) {
  return new Promise((resolve, reject) => {
    if (
      destinationsCache[name] &&
      destinationsCache[name]._timestamp + MAX_AGE_IN_MS > Date.now()
    ) {
      resolve(destinationsCache[name]);

      // we could check if the destination is valid for less than e.g. one minute and refresh the cache (but resolving immediately)
      return;
    }

    Utils.getJWTTokenForService(destination).then(token => {
      var uri = {};
      try {
        uri = url.parse(destination.uri + '/destination-configuration/v1/destinations/' + name);
      } catch (e) {
        console.error('error parsing uri', e);
        reject('destination service error - see logs');
        return;
      }

      var options = {
        protocol: uri.protocol,
        host: uri.host,
        port: uri.port,
        path: uri.path,
        headers: {}
      };
      options.headers[HEADER_AUTH] = 'Bearer ' + token;

      https
        .get(options, res => {
          res.setEncoding('utf8');
          let data = '';
          res.on('data', c => {
            data += c;
          });
          res.on('end', () => {
            try {
              destinationsCache[name] = new Destination(JSON.parse(data));
              resolve(destinationsCache[name]);
            } catch (e) {
              console.error(e);
              reject('destination service error - see logs');
              return;
            }
          });
        })
        .on('error', e => {
          console.error(e);
          reject('destination service error - see logs');
        });
    });
  });
}

class Destination {
  constructor(data) {
    this._timestamp = Date.now();

    if (!('destinationConfiguration' in data)) {
      // TODO: could check even more here, maybe use a JSON Schema before parsing
      throw new Error('Invalid Destination configuration: ' + JSON.stringify(data));
    }
    this.destinationConfiguration = data.destinationConfiguration;
    this.authTokens = data.authTokens;
  }

  hasLocationId() {
    return typeof this.destinationConfiguration.CloudConnectorLocationId === 'string';
  }

  getLocationId() {
    return this.destinationConfiguration.CloudConnectorLocationId;
  }
}

module.exports = Route;
