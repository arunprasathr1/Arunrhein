const axios = require("axios");
function triggerJob(config) {
  let tok = "E2E_REPO:Welcome1";
  let hash = Buffer.from(tok).toString("base64");
  var logreq = {
    async: false,
    crossDomain: true,
    url: "http://mo-c14bd36bc.mo.sap.corp:8000/sap/bc/soap/rfc",
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
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">\r\n   <soapenv:Header/>\r\n   <soapenv:Body>\r\n      <urn:Z_S4_DATA_CREATION></urn:Z_S4_DATA_CREATION>\r\n   </soapenv:Body>\r\n</soapenv:Envelope>'
  };
  axios(logreq).then(s => console.log(s));
}

triggerJob();
