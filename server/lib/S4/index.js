const axios = require("axios");

function getStatus(config) {
  let ds = config["config"].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  let tok = ds[2]["value"] + ":" + ds[3]["value"];
  let hash = Buffer.from(tok).toString("base64");
  let logreq = {
    async: false,
    crossDomain: true,
    baseURL: "http://" + ds[0]["value"] + ":" + ds[1]["value"],
    method: "GET",
    headers: {
      "Content-Type": "text/xml",
      "Cache-Control": "no-cache",
      Authorization: "Basic " + hash,
      "Cache-Control": "no-cache"
    }
  };
  const re = axios.create(logreq);
  return re.get("/sap/bc/icf/info");
}

function triggerJob(config) {
  let ds = config["config"].sort((a, b) => (a.seq || 0) - (b.seq || 0));
  let tok = ds[2]["value"] + ":" + ds[3]["value"];
  let hash = Buffer.from(tok).toString("base64");
  var logreq = {
    async: false,
    crossDomain: true,
    url: "http://" + ds[0]["value"] + ":" + ds[1]["value"] + "/sap/bc/soap/rfc",
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
      "Cache-Control": "no-cache",
      Authorization: "Basic " + hash,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept"
    },
    data:
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">\r\n   <soapenv:Header/>\r\n   <soapenv:Body>\r\n      <urn:' +
      ds[4]["value"] +
      "></urn:" +
      ds[4]["value"] +
      ">\r\n   </soapenv:Body>\r\n</soapenv:Envelope>"
  };
  return axios(logreq);
}

module.exports = { status: getStatus, execute: triggerJob };
