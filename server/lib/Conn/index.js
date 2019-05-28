/*********************************************************
 * Imports
 *********************************************************/
const url = require('url');
const Utils = require('./UserAuth');
const HttpProxyAgent = require('http-proxy-agent');

/*********************************************************
 * Constants
 *********************************************************/
const KEY_PROXY_HOST = 'onpremise_proxy_host';
const KEY_PROXY_PORT = 'onpremise_proxy_port';
const HEADER_SAP_AUTH = 'SAP-Connectivity-Authentication';
const HEADER_PROXY_AUTH = 'Proxy-Authorization';
const HEADER_AUTH = 'Authorization';
const HEADER_LOCATION_ID = 'SAP-Connectivity-SCC-Location_ID';
const NEO_APP_FILE = 'static/neo-app.json';
const AUTH_TYPE_BASIC = 'BasicAuthentication';
const AUTH_TYPE_PP = 'PrincipalPropagation';
const AUTH_TYPE_NONE = 'NoAuthentication';

const ALLOWED_HEADERS_IN = [
  'accept',
  'accept-language',
  'dataserviceversion',
  'maxdataserviceversion',
  'content-length',
  'content-type',
  'x-csrf-token',
  'cookie'
];
const ALLOWED_HEADERS_OUT = ['content-type', 'content-length', 'x-csrf-token', 'set-cookie'];

const connectivity = Utils.getServiceByName('connectivity');
const destination = Utils.getServiceByName('destination');

function getOptionsFromTarget(route, req) {
  return route.getDestination().then(destination => {
    const uri = url.parse(
      destination.destinationConfiguration.URL + route.target.entryPath //+
      //req.url.substr(route.path.length)
    );
    const agnt = new HttpProxyAgent(
      'http://' + connectivity[KEY_PROXY_HOST] + ':' + connectivity[KEY_PROXY_PORT]
    );
    //var options = {
    //  url: uri.href,
    //  agent: agnt,
    //  headers: { Host: uri.host }
    //};

    var options = {
      host: connectivity[KEY_PROXY_HOST],
      port: parseInt(connectivity[KEY_PROXY_PORT]),
      path: uri.href,
      headers: { Host: uri.host }
    };

    switch (destination.destinationConfiguration.Authentication) {
      case AUTH_TYPE_BASIC:
        options.headers[HEADER_AUTH] =
          destination.authTokens[0].type + ' ' + destination.authTokens[0].value;
        break;
      case AUTH_TYPE_PP:
        options.headers[HEADER_SAP_AUTH] = req.headers.authorization;
        break;
      case AUTH_TYPE_NONE:
        // ignore
        break;
      default:
        console.warn(
          `Destination uses unsupported authentication method "${
            destination.destinationConfiguration.Authentication
          }" this might cause problems.`
        );
    }

    if (destination.hasLocationId()) {
      options.headers[HEADER_LOCATION_ID] = destination.getLocationId();
    }

    return options;
  });
}

async function serveFromOnPremise(route, req) {
  return new Promise((resolve, reject) => {
    Promise.all([Utils.getJWTTokenForService(connectivity), getOptionsFromTarget(route, req)])
      .then(([token, options]) => {
        Object.keys(req.headers)
          .filter(name => ALLOWED_HEADERS_IN.indexOf(name.toLowerCase()) >= 0)
          .forEach(name => {
            options.headers[name] = req.headers[name];
          });

        options.headers[HEADER_PROXY_AUTH] = 'Bearer ' + token;
        options.method = route.target.method;
        options.data = route.target.data.split("'").join('"');
        if (options.method === 'POST') {
          options.headers['Content-Type'] = 'text/xml';
        }
        resolve(options);
        return;
      })
      .catch(error => {
        reject(error);
      });
  });
}

module.exports = { getOptions: serveFromOnPremise };
