const BW = require("../BW");
const S4 = require("../S4");
const log = require("./logger");
const report = require("./reportGenerator");
const xml = require("./xmlHandler");
const utils = require("./utils");
const info = require("./info");
const dom = require("xmldom");

function handleFailure(data, path, config) {
  config["stats"]["current"]["status"] = "Dead";
  config["stats"]["current"]["endTime"] = new Date().toUTCString();
  config["stats"]["current"]["message"] = data;
  utils.putFile(path.Path, config, true);
  updateMasterJson(path, "Dead");
}

function updateMasterJson(scenarioConfig, status) {
  rawdata = utils.getFile("./config/ScenarioList.json");
  config = JSON.parse(rawdata);
  let scenario = config.find(s => s.id === parseInt(scenarioConfig.id));
  scenario["Status"] = status;
  utils.putFile("./config/scenarioList.json", config, true);
}

async function handleExecution(path) {
  log.logger.info("Started Execution");
  const rawdata = utils.getFile(path.Path);
  let config = JSON.parse(rawdata);
  let graphElements = [];
  let grFlow = config["graph"].sort(
    (a, b) => (a.displaySequence || 0) - (b.displaySequence || 0)
  );
  for (var ind in grFlow) {
    let sysName = grFlow[ind]["displayName"];
    let elementStatus = {
      id: grFlow[ind]["displaySequence"],
      system: grFlow[ind]["displayName"],
      jobId: "NA",
      status: "Init",
      startTime: new Date().toUTCString(),
      endTime: ""
    };
    log.logger.info(
      "currently executing " + sysName + " system with ID: " + grFlow[ind]["id"]
    );
    let elConfig = config["elements"][grFlow[ind]["id"]];
    if (sysName === "BW" && elConfig["config"][4]["value"] !== "-") {
      let sync_promise = new Promise(function(resolve, reject) {
        setTimeout(resolve, 100000, "one");
      });
      await Promise.race([BW.execute(elConfig), sync_promise])
        .then(function(response) {
          elementStatus["jobId"] = xml.getTagValue(
            response.data.toString(),
            "E_LOGID"
          );
          elementStatus["status"] = "Active";
          log.logger.info(
            "Invoked the job in " +
              sysName +
              " system, the Job ID is " +
              elementStatus["jobId"]
          );
        })
        .catch(function(response) {
          elementStatus["jobId"] = "0000";
          elementStatus["status"] = "Failed";
          log.logger.error(
            "Failed to start job with the follwing error :: " + response.data
          );
          handleFailure(response.data, path, config);
          return;
        });
      log.logger.info(
        "Checking the job status for the job with job ID:: " +
          elementStatus["jobId"]
      );
      while (elementStatus["status"] === "Active") {
        if (elementStatus["system"] === "BW") {
          console.log("Waiting");
          let sync_promise = new Promise(function(resolve, reject) {
            setTimeout(resolve, 100000, "one");
          });
          await Promise.race([
            BW.jobStatus(elConfig, elementStatus["jobId"]),
            sync_promise
          ])
            .then(function(response) {
              elementStatus["status"] = xml.getTagValue(
                response.data.toString(),
                "MSGV3"
              );
              log.logger.info(
                xml
                  .getTagValue(response.data.toString(), "E_MESSAGE")
                  .split("&#34;")
                  .join('"')
              );
            })
            .catch(function(response) {
              log.logger.error(response.data);
              log.logger.warn(
                "Faile to get job status with following error  :: " +
                  response.data
              );
            });
          utils.wait(2000);
        }
      }
      elementStatus["endTime"] = new Date().toUTCString();
      graphElements.push(elementStatus);
    }
    if (
      (sysName === "S4" || sysName === "ERP") &&
      elConfig["config"][4]["value"] !== "-"
    ) {
      let sync_promise = new Promise(function(resolve, reject) {
        setTimeout(resolve, 100000, "one");
      });
      await Promise.race([S4.execute(elConfig), sync_promise])
        .then(function(response) {
          elementStatus["status"] = "Ok";
          log.logger.info("Invoked the job in " + sysName + " system.");
        })
        .catch(function(response) {
          elementStatus["jobId"] = "0000";
          elementStatus["status"] = "Failed";
          log.logger.error(
            "Failed to start job with the follwing error :: " + response.data
          );
          handleFailure(response.data, path, config);
          return;
        });

      elementStatus["endTime"] = new Date().toUTCString();
      graphElements.push(elementStatus);
    }
    config["stats"]["current"]["endTime"] = new Date().toUTCString();
  }
  for (var key in graphElements) {
    var element = graphElements[key];
    if (element.status !== "Ok" || element.status === "SUCCESS") {
      config["stats"]["current"]["status"] = "Dead";
      config["stats"]["current"]["message"] =
        "Graph Failed. Please refer logs for more info.";
      break;
    } else {
      config["stats"]["current"]["status"] = "Completed";
      config["stats"]["current"]["message"] =
        "Graph execution completed successfully";
      log.logger.info("Completed execution of the scenario");
    }
  }
  utils.putFile(path.Path, config, true);
  updateMasterJson(path, "Completed");
  let html = report.get(config, graphElements);
  utils.putFile("./test.html", html, false);
}

async function checkConnection(scenario) {
  let status = "Checking";
  let msg = "";
  let info_op = {};
  //let scenario = scList.find(s => s.id === parseInt(graphid));
  //if (!scenario) res.status(404).send("Scenario not found");
  const rawdata = utils.getFile(scenario.Path);
  let config = JSON.parse(rawdata);
  let sync_promise = new Promise(function(resolve, reject) {
    setTimeout(resolve, 100000, "one");
  });
  for (var ind in config["graph"]) {
    let getInfo = false;
    let elConfig = config["elements"][config["graph"][ind]["id"]];
    if (config["graph"][ind]["displayName"] === "BW") {
      getInfo = true;
      await Promise.race([BW.status(elConfig), sync_promise])
        .then(function(response) {
          status = "Connection Established";
        })
        .catch(function(response) {
          status = "Failed";
          msg = "Connection Failed to BW system.";
        });
    }
    if (
      config["graph"][ind]["displayName"] === "S4" ||
      config["graph"][ind]["displayName"] === "ERP"
    ) {
      getInfo = true;
      await Promise.race([S4.status(elConfig), sync_promise])
        .then(function(response) {
          status = "Connection Established";
        })
        .catch(function(response) {
          status = "Failed";
          msg = "Connection Failed to S4 system.";
        });
    }
    if (getInfo) {
      await Promise.race([info.getInfo(elConfig), sync_promise]).then(function(
        response
      ) {
        var ver2 = xml.getTagValue(response.data.toString(), "STACK_CAPTION");
        var infData = xml.toJson(
          new dom.DOMParser().parseFromString(
            xml.getTagValue(response.data.toString(), "ET_SWPRODUCTS")
          )
        );
        info_op[config["graph"][ind]["displayName"]] = {
          item: [].concat(infData["item"])
        };
        if (!ver2.toString().startsWith("<?", 0))
          info_op[config["graph"][ind]["displayName"]]["item"][0]["VERSION"] =
            info_op[config["graph"][ind]["displayName"]]["item"][0]["VERSION"] +
            "." +
            ver2;
      });
    }
  }
  config["info"] = info_op;
  let op = { current: {}, history: {} };
  op["history"] = config["stats"]["current"];
  op.current.id = "--";
  op.current.initTime = "--";
  op.current.startTime = "--";
  op.current.status = status;
  op.current.endTime = "--";
  op.current.message = msg;
  utils.putFile(scenario.Path, config, true);
  config["stats"] = op;
  return config;
}

module.exports = {
  wait: utils.wait,
  execGraph: handleExecution,
  read: utils.getFile,
  write: utils.putFile,
  getId: utils.getgraphId,
  log: log.logger,
  status: checkConnection,
  isFile: utils.isFile
};
