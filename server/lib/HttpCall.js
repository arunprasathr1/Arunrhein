/***********
 * Module to make a http get or post call from the server
 */

const http = require('http');

/*****************
 * Makes a http request to the passed options
 */
function makeCall(options) {
  return new Promise((resolve, reject) => {
    var proxyRequest = http.request(options, backendres =>
      backendres.on('data', c => {
        resolve(c.toString('utf-8'));
      })
    );
    if (options.method === 'POST') {
      proxyRequest.write(options.data);
      proxyRequest.end();
    } else {
      proxyRequest.end();
    }
  });
}

module.exports = { call: makeCall };
