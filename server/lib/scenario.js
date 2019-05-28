/***************
 * Imports
 */
const utils = require('./utils');
const Routeclass = require('./Conn/Destination');
const conn = require('./Conn');
const requestCall = require('./HttpCall');
const logger = require('./logger');
const dom = require('xmldom');
const path = require('path');

/*********
 * The entry Paths for each individual systems will be fetchedd from the json
 * */
const entryPaths = JSON.parse(utils.read('./config/entryPaths.json'));

/****
 * cache of all the running scenario's for providing status updates to the UI
 * */
var scenarioCache = {};

/***********************
 * Makes updates to the Scenario cache
 * *********************/
function updateGraphStatus(id, initTime, startTime, status, message, req) {
  console.log('Updating graph status');
  scenarioCache[id]['startTime'] = startTime;
  scenarioCache[id]['status'] = status;
  scenarioCache[id]['message'] = message;
  if (status.toLowerCase() in ['dead', 'completed']) {
    scenarioCache[id]['endTime'] = new Date().toISOString().replace('T', ' ');
    scenarioCache[id]['message'] = message + '. Please Check the Logs for more Info';
    markCompletion(id, req);
  }
}

/******
 * Add a Scenario Runtime Handle to the Cache
 */
function addGraphStatus(id, graphId, initTime, startTime, status, message) {
  scenarioCache[id] = {
    id: graphId,
    initTime: initTime,
    startTime: startTime,
    status: status,
    message: message
  };
}

/*************************
 * Update to the DB the completion status of the scenario
 */
function markCompletion(id, request) {
  console.log('making DB entry');
  let scenario = scenarioCache[id];
  let sql =
    `UPDATE "rhein.rheindb::USER_PROCESS_LOG" SET
    "JOB_START_TIME" = '` +
    scenario.startTime +
    `',
    "JOB_END_TIME" = '` +
    scenario.endTime +
    `',
    "JOB_STATUS" = '` +
    scenario.status +
    `'`;
  request.db.execute(sql, function(err, result) {
    if (err) {
      console.log(err);
      this.log.logger.error('Not able to write data to DB');
      return;
    }
    console.log(result);
  });
  ///Update the logggggg
  //Delete the Graph Details From Cache
  //delete scenarioCache[id];
  //Write the logs to DB
  //delete the temp log_file
}

class Scenario {
  /**********************************
   * Class Scenario-- Expects a Graph ID, configuration and request
   *  as parameters to create a object
   * ********************************/
  constructor(graphId, data, req) {
    this.id = utils.getgraphId();
    this.ScenarioId = graphId;
    this.initTime = new Date().toISOString().replace('T', ' ');
    this.startTime = '--';
    this.endTime = '--';
    this.flow = utils.getFlowOrder(data, entryPaths);
    this.elements = utils.buildFromData(data);
    this.req = req;
    this.log = new logger(this.id);
    addGraphStatus(
      this.id,
      this.ScenarioId,
      this.initTime,
      this.startTime,
      'Started',
      'Graph Execution Started',
      this.req
    );
  }

  /******
   * Retuns the status of the scenario from the Scenario Cache
   */
  static getScenarioStatus(id) {
    return scenarioCache[id];
  }

  /****************
   * Just a Wrapper to start the Checks and Execution
   * ***************/
  async start() {
    this.log.logger.info('Starting the graph execution');
    await this.checkConnection();
  }

  /**********
   * Sets status of particular element.
   * Also Checks for the status of any active jobs
   * ***********/
  async setStatus(element, status) {
    console.log('In setting status');
    this.log.logger.info('Checking the job status on ' + element + ' system');
    this.elements[element]['status'] = status;
    while (status.toLowerCase() === 'active' || status.toLowerCase() === 'started') {
      if (!(this.elements[element]['sysType'] === 'BW')) {
        this.elements[element]['status'] = 'Ok';
        status = 'Ok';
        break;
      }
      let conf = this.elements[element];
      let pathConf = entryPaths[conf['sysType']]['jobstatus'];
      // Update the Data with corresponding Job ID for each individual system
      pathConf['data'] = utils.updateJobId(conf, conf['jobId'], pathConf['data']);
      let rout = new Routeclass(conf['config']['destination'], pathConf);
      var reqOptions = {};
      await conn.getOptions(rout, this.req).then(function(r) {
        reqOptions = r;
      });
      var stat = '';
      let self = this;
      await requestCall.call(reqOptions).then(function(re) {
        stat = utils.getTagValue(re.toString(), 'MSGV3');
        self.log.logger.info('The Status of the system is:: ' + stat);
      });
      status = stat;
      //Fetch the job Status
      status = utils.fetchJobStatus(conf['sysType'], stat);
    }
    this.elements[element]['status'] = status;
    this.log.logger.info('Current status of ' + element + ' is ' + status);
  }

  /************
   * Sets Job ID for a individual job as returned from the system and calls set status for checking the status of Job
   * ************/
  async setJobId(element, jobId) {
    this.elements[element]['jobId'] = jobId;
    this.log.logger.info('Executed the Job on ' + element + ' system with Job ID: ' + jobId);
    await this.setStatus(element, 'started');
  }

  /***********************
   * Checks the connectivity to all the systems mentioned in the UI configuration
   * Will allow the execution to start if able to make connections to all the systems involved
   ************************/
  async checkConnection() {
    console.log('Initiating Connection Checks');
    this.log.logger.info('Initiating the connection checks');
    for (var ind in this.flow) {
      let id = this.flow[ind];
      let conf = this.elements[id];
      if (!(conf['sysType'] in entryPaths)) {
        this.setStatus(id, 'Connected');
        continue;
      }
      let pathConf = entryPaths[conf['sysType']]['status'];
      let rout = new Routeclass(conf['config']['destination'], pathConf);
      var reqOptions = {};
      await conn.getOptions(rout, this.req).then(function(r) {
        reqOptions = r;
      });
      var stats = 'Connected';
      var self = this;
      await requestCall.call(reqOptions).then(function(re) {
        try {
          //  var ver2 = utils.getTagValue(re.toString(), 'STACK_CAPTION');
          var infData = utils.xmlToJson(
            new dom.DOMParser().parseFromString(utils.getTagValue(re.toString(), 'ET_SWPRODUCTS'))
          );
          self.elements[id]['info'] = { item: [].concat(infData['item']) };
          //  if (ver2) {
          //    self.elements[id]['info']['item'][0]['VERSION'] =
          //      self.elements[id]['info']['item'][0]['VERSION'] + '.' + ver2;
          //  }
        } catch (err) {
          console.log(err);
          self.log.logger.error('Encountered Error :: ' + err.toString());
          stats = 'Connection Failed';
        }
      });
      this.setStatus(id, stats);
    }
    this.log.logger.info('Completed the connection Checks');
    var doExecute = true;
    for (var key in this.flow) {
      let element = this.elements[this.flow[key]];
      if (element['status'] !== 'Connected') {
        updateGraphStatus(
          this.id,
          this.initTime,
          this.startTime,
          'Dead',
          'Connection Failed to ' + element['sysType'] + ' System',
          this.req
        );
        this.log.logger.error(
          'Not able to extablish connection to ' + element['sysType'] + ' System'
        );
        doExecute = false;
        return;
      }
    }
    if (doExecute) {
      updateGraphStatus(this.id, this.initTime, this.startTime, 'Running', '', this.req);
      this.executeGraph();
    }
  }

  /**************
   * This Function will be called only after we're able to make connections to all the systems.
   * Actual Graph Execution starts here
   * *****************/
  async executeGraph() {
    this.log.logger.info('Starting the Jobs');
    this.startTime = new Date().toISOString().replace('T', ' ');
    for (var id in this.flow) {
      let conf = this.elements[this.flow[id]];
      conf['startTime'] = new Date().toISOString().replace('T', ' ');
      this.log.logger.info('Currently executing system: ' + id);

      let pathConf = entryPaths[conf['sysType']]['trigger'];
      // Update the Data with the corresponding Fm/PC name
      let tmpData = utils.updateJobName(conf, pathConf['data']);
      pathConf['data'] = tmpData;
      let rout = new Routeclass(conf['config']['destination'], pathConf);
      var reqOptions = {};
      await conn.getOptions(rout, this.req).then(function(r) {
        reqOptions = r;
      });
      var stat = '';
      await requestCall.call(reqOptions).then(function(re) {
        stat = re.toString();
      });
      // Fetch the Job ID based on system
      let jobId = utils.fetchJobId(conf['sysType'], stat);
      await this.setJobId(this.flow[id], jobId);
      if (!(conf['sysType'] === 'BW')) {
      }
      this.elements[this.flow[id]]['endTime'] = new Date().toUTCString();
    }
    //this.updatetoDB();
    var isCompleted = true;
    for (var key in this.flow) {
      let element = this.elements[this.flow[key]];
      if (element['status'] !== 'Ok') {
        updateGraphStatus(
          this.id,
          this.initTime,
          this.startTime,
          'Dead',
          'Not able to run Job on ' + element['sysType'] + ' System',
          this.req
        );
        isCompleted = false;
        return;
      }
    }
    console.log('is Comp ::' + isCompleted.toString());
    if (isCompleted) {
      updateGraphStatus(
        this.id,
        this.initTime,
        this.startTime,
        'Completed',
        'Graph Completed Successfully',
        this.req
      );
    }
  }
  updatetoDB() {
    let sql = this.prepareSQL();
    var self = this;
    this.req.db.exec(sql, function(err, results) {
      if (err) {
        this.log.logger.error('Error writing to DB ::  ' + err.toString());
        return;
      }
      utils.removeFile(self.log.logFilename);
    });
  }
  prepareSQL() {
    let logCont = utils.read(this.log.logFilename);
    let dict = {
      id: this.id,
      ScenarioId: this.ScenarioId,
      initTime: this.initTime,
      startTime: this.startTime,
      endTime: this.endTime,
      flow: this.flow,
      elements: this.elements,
      req: ''
    };
    let dt = new Date().toISOString().split('T');
    let rtrnStr =
      `INSERT INTO "rhein.rheindb::LOG_DETAIL" VALUES ('` +
      this.id +
      `','` +
      dt[0] +
      `','` +
      JSON.stringify(dict) +
      `','` +
      logCont
        .toString('utf-8')
        .split(`\r\n`)
        .join('&') +
      `')`;
    return rtrnStr;
  }
}

module.exports = Scenario;
