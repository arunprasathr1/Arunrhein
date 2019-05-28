/********************
 * Module with functions to interact with DB
 * Supported operations READ,WRITE,UPDATE
 */

const hdbext = require('@sap/hdbext');
const xsenv = require('@sap/xsenv');

const hanaOptions = xsenv.getServices({
  hana: {
    tag: 'hana'
  }
});

var client = connect(hanaOptions);

function connect(hanaOpt) {
  const hanaConfig = {
    encrypt: 'false',
    host: hanaOpt.hana.host,
    port: hanaOpt.hana.port,
    user: hanaOpt.hana.hdi_user,
    password: hanaOpt.hana.hdi_password
  };
  hdbext.createConnection(hanaConfig, function(err, client) {
    if (err) {
      console.log('DB CONNECT ERROR :: ' + JSON.stringify(err));
      return;
    }
    return client;
  });
}

function exec(sql) {
  client.exec(sql, function(err, res) {
    console.log(err);
    console.log('Result ');
    console.log(res);
  });
}

/*********
 * Fetch results from DB
 */
function get(req, sql) {
  return new Promise((resolve, reject) => {
    req.db.exec(sql, function(err, results) {
      if (err) {
        console.log('Error fetching from DB ::  ' + err.toString());
        reject(err);
      }
      resolve(results);
      //  exec(sql);
    });
  });
}

/*********
 * Write data to DB
 */
function put(req, sql) {
  req.db.exec(sql, function(err, results) {
    if (err) {
      console.log('Error fetching from DB ::  ' + err.toString());
      return false;
    }
    return true;
  });
}

module.exports = { get, put };
