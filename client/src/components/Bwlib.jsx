import React from "react";
import axios from "axios";

class BW extends React.PureComponent {
  state = {
    config: []
  };

  getStatus = () => {
    // if (this.state.config.length === 0) return;
    var tok =
      this.state.config[2]["value"] + ":" + this.state.config[3]["value"];
    var hash = window.btoa(tok);
    var logreq = {
      async: false,
      crossDomain: true,
      baseURL:
        "http://" +
        this.state.config[0]["value"] +
        ":" +
        this.state.config[1]["value"],
      method: "GET",
      headers: {
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
        Authorization: "Basic " + hash,
        "Cache-Control": "no-cache"
      }
    };
    const re = axios.create(logreq);
    var self = this;
    re.get("/sap/bw/whm/backend/discovery ")
      .then(function(response) {
        self.props.status("Connection Established", true);
      })
      .catch(function(response) {
        self.props.status("Invalid Configuration", true);
      });
  };
  triggerJob = () => {
    if (this.state.config.length === 0) return;
    var tok =
      this.state.config[2]["value"] + ":" + this.state.config[3]["value"];
    var hash = window.btoa(tok);

    var settings = {
      async: false,
      crossDomain: true,
      url:
        "http://" +
        this.state.config[0]["value"] +
        ":" +
        this.state.config[1]["value"] +
        "/sap/bc/soap/rfc",
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
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:sap-com:document:sap:rfc:functions">\r\n   <soapenv:Header/>\r\n   <soapenv:Body>\r\n      <urn:RSPC_API_CHAIN_START>\r\n         <I_CHAIN>' +
        this.state.config[4]["value"] +
        "</I_CHAIN>\r\n      </urn:RSPC_API_CHAIN_START>\r\n   </soapenv:Body>\r\n</soapenv:Envelope>"
    };
    var XMLParser = require("react-xml-parser");
    var self = this;
    axios(settings)
      .then(function(response) {
        var xml = new XMLParser().parseFromString(response.data);
        var s = xml.getElementsByTagName("E_LOGID");
        self.props.jobId(s[0]["value"]);
        self.props.status("Running", false);
      })
      .catch(function(response) {
        self.props.status("Trigger failed", true);
        self.props.mesg(response.data);
      });
  };

  callFun = () => {
    this.state.config = this.props.config;
    switch (this.props.func) {
      case "jobStatus":
        this.getJobStatus();
        break;
      case "StartJob":
        this.state.config === 0
          ? this.props.mesg("Please validate the Connection first")
          : this.triggerJob();
        break;
      case "sysStatus":
        this.getStatus(this.props.config);
        break;
    }
  };
  // shouldComponentUpdate = (nextProps, nextState) => {
  //   this.props.status = nextProps.status;
  //   return false;
  // };
  render() {
    {
      this.props.init ? this.callFun() : null;
    }
    return <h1 />;
  }
}

export default BW;
