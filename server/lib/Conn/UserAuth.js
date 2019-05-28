/*
 * Express middleware validating JWT tokens
 */

/*********************************************************
 * Imports
 *********************************************************/
const Utils = require('./Utils');
const xsenv = require('@sap/xsenv');
const uaa = require('predix-uaa-client');

/*********************************************************
 * Constants
 *********************************************************/
const BEGIN = '-----BEGIN PUBLIC KEY-----';
const END = '-----END PUBLIC KEY-----';
const services = xsenv.getServices({
  connectivity: { tag: 'connectivity' },
  destination: { tag: 'destination' },
  xsuaa: { tag: 'xsuaa' },
  hana: { tag: 'hana' }
});

/*********************************************************
 * Get Service Credentials by Name
 *********************************************************/
function getServiceByName(name) {
  return services[name];
}

/*********************************************************
 * Request token for service from XSUAA
 * (e.g. connectivity or destination service)
 *********************************************************/
function getJWTTokenForService(service) {
  if (typeof service === 'string') {
    service = Utils.getServiceByName(service);
  }
  return uaa
    .getToken(services.xsuaa.url + '/oauth/token', service.clientid, service.clientsecret)
    .then(token => token.access_token);
}

module.exports = { getServiceByName, getJWTTokenForService };
