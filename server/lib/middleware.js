/****************
 * Wrapper module, that consists of different functions.
 * These functions were used to interact with DB module
 * and return the values in the standard JSOn format that the UI expects
 */

/******
 * Imports
 */
const db = require('./db');
const scn = require('./scenario');
const utils = require('./utils');
const path = require('path');

/******
 * Holds the Scenario Configurations for all the Scenario's
 */
var masterCache = {};

/*****
 * Fetches the Scenarios from the DB
 * returns the list in JSON format
 * also initiates & populates the mastercache
 */
async function getScenarioList(req, res) {
  let sql =
    `WITH USERS AS (SELECT USER_ID FROM "rhein.rheindb::USERS_GROUP" WHERE GROUP_ID IN (SELECT GROUP_ID FROM "rhein.rheindb::USERS_GROUP" WHERE USER_ID ='` +
    req.authInfo.getEmail() +
    `'))
SELECT SCN."SCENARIO_ID",SCN."SCENARIO_NAME",SCN."SCENARIO_DESC", SCN."TAGS", SCN."CONFIG" FROM "rhein.rheindb::SCENARIO_MSTR" AS SCN JOIN USERS ON
SCN.CREATED_BY = USERS.USER_ID`;
  await db.get(req, sql).then(function(dbResp) {
    maintainCache(dbResp);
    let rtVal = [];
    for (var key in masterCache) {
      var tDict = masterCache[key];
      tDict['id'] = parseInt(key);
      var rtLen = rtVal.push(tDict);
    }
    rtVal = rtVal.sort((a, b) => (a.ID || 0) - (b.ID || 0));
    console.log(rtVal);
    res.json(rtVal);
    return rtVal;
  });
}

/****
 * Returns the scenario JSON.
 * Initially searches the scenario Cache, if not found checks in DB
 */
function fetchScenario(id, req) {
  if (masterCache[id]) {
    return masterCache[id];
  }
  let dbResp = db.get(
    req,
    'SELECT "SCENARIO_ID","SCENARIO_NAME","SCENARIO_DESC","TAGS","CONFIG" FROM "rhein.rheindb::SCENARIO_MSTR" WHERE "SCENARIO_ID" = ' +
      id.toString()
  );
  if (dbResp) {
    addtoCache(dbResp);
  }
  return masterCache[id];
}

/****
 * Generates a JSON that consists of the complete configuration,
 * current run and previous run details for a
 */
async function getScenario(id, req, res) {
  var rtrnval = await fetchScenario(id, req);
  rtrnval['stats'] = await buildStats(id, req);
  if (rtrnval['stats']['current']['id'] !== '') {
    var data = await fetchLastConfig(rtrnval['stats']['current']['id'], req);
    rtrnval['info'] = {};
    for (var elId in rtrnval['graph']) {
      rtrnval['graph'][elId]['config'] = data[rtrnval['graph'][elId]['id']].config;
      if (data[rtrnval['graph'][elId]['id']].info)
        rtrnval['info'][rtrnval['graph'][elId]['id']] = data[rtrnval['graph'][elId]['id']].info;
    }
  }
  console.log(rtrnval);
  res.json(rtrnval);
}

/***********************
 * Executes the scenario
 */
async function execScenario(id, req, res) {
  var rtrnval = await fetchScenario(id, req);
  rtrnval['stats'] = await buildStats(id, req);
  var data = await fetchLastConfig(rtrnval['stats']['current']['id'], req);
  for (var elId in rtrnval['graph']) {
    rtrnval['graph'][elId]['config'] = data[rtrnval['graph'][elId]['id']].config;
  }
  let sc = new scn(id, rtrnval, req);
  makeDBentry(sc.id, id, req);
  //let histStat = rtrnval['stats']['current'];
  rtrnval['stats']['history'] = rtrnval['stats']['current'];
  rtrnval['stats']['current'] = {
    id: sc.id,
    initTime: new Date().toISOString().replace('T', ' '),
    startTime: '--',
    status: 'Running',
    endTime: '--',
    message: 'Started the graph execution'
  };
  await sc.start();
  res.json(rtrnval);
}

async function sendStatus(id, req, res) {
  var rtrnval = await fetchScenario(id, req);
  rtrnval['stats'] = await buildStats(id, req);
  if (rtrnval['stats']['current']['id'] !== '') {
    var data = await fetchLastConfig(rtrnval['stats']['history']['id'], req);
    for (var elId in rtrnval['graph']) {
      rtrnval['graph'][elId]['config'] = data[rtrnval['graph'][elId]['id']].config;
    }
  }
  let curStat = scn.getScenarioStatus(rtrnval['stats']['current']['id']);
  rtrnval['stats']['current']['startTime'] = curStat.startTime;
  rtrnval['stats']['current']['endTime'] = curStat.endTime;
  rtrnval['stats']['current']['status'] = curStat.status;
  console.log(rtrnval);
  res.json(rtrnval);
}

async function sendLog(id, req, res) {
  var rLog = '';
  var rtrnval = await fetchScenario(id, req);
  rtrnval['stats'] = await buildStats(id, req);
  let file = path.join('./log/' + rtrnval['stats']['current']['id'] + '.log');
  if (utils.isFile(file)) {
    rLog = utils.read(file);
  } else {
    let sql =
      `SELECT "COMMENTS" FROM "rhein.rheindb::LOG_DETAIL" WHERE JOB_ID = '` +
      rtrnval['stats']['current']['id'] +
      `'`;
    await db.get(req, sql).then(function(dbResp) {
      let rVal = dbResp[0]['COMMENTS'];
      rLog = rVal.split('&').join(`\r\n`);
    });
  }
  let rt = { log: rLog };
  res.json(rt);
}

function makeDBentry(scnId, id, req) {
  let dt = new Date().toISOString().split('T');
  let sql =
    `INSERT INTO "rhein.rheindb::USER_PROCESS_LOG" VALUES ('` +
    scnId +
    `','` +
    dt[0] +
    `','` +
    req.authInfo.getEmail() +
    `',` +
    id.toString() +
    `,'','','')`;
  db.put(req, sql);
}

/****
 * Fetches the last two run details from DB
 */
function buildStats(id, req) {
  return new Promise((resolve, reject) => {
    let sql =
      `WITH USERS AS (SELECT USER_ID FROM "rhein.rheindb::USERS_GROUP" WHERE GROUP_ID IN (SELECT GROUP_ID FROM "rhein.rheindb::USERS_GROUP" WHERE USER_ID ='` +
      req.authInfo.getEmail() +
      `'))
SELECT TOP 2 UPL.* FROM "rhein.rheindb::USER_PROCESS_LOG" AS UPL JOIN USERS ON
UPL.PROCESSED_BY = USERS.USER_ID AND UPL.SCENARIO_ID = ` +
      id.toString() +
      ` ORDER BY PROCESSED_DATE DESC`;
    db.get(req, sql).then(function(dbResp) {
      if (dbResp) {
        resolve({
          current: createStats(dbResp[0]),
          history: createStats(dbResp[1])
        });
      } else {
        reject({});
      }
    });
  });
}

function createStats(data) {
  let rtrnVal = {
    id: '',
    initTime: '--',
    startTime: '--',
    status: 'Not started',
    endTime: '--',
    message: ''
  };
  if (typeof data !== 'undefined') {
    if (data.JOB_ID) rtrnVal.id = data.JOB_ID;
    if (data.PROCESSED_DATE) rtrnVal.initTime = data.PROCESSED_DATE;
    if (data.JOB_START_TIME) rtrnVal.startTime = data.JOB_START_TIME;
    if (data.JOB_END_TIME) rtrnVal.endTime = data.JOB_END_TIME;
    if (data.JOB_STATUS) rtrnVal.status = data.JOB_STATUS;
    if (data.JOB_MESSAGE) rtrnVal.message = data.JOB_MESSAGE;
  }
  return rtrnVal;
}

/*****
 * Fetches the last run Details
 */
function fetchLastConfig(jobId, req) {
  let rtrnVal = {
    config: {},
    info: {}
  };
  let sql =
    `SELECT "DESCRIPTION" FROM "rhein.rheindb::LOG_DETAIL" WHERE "JOB_ID" = '` + jobId + `'`;
  return new Promise((resolve, reject) => {
    db.get(req, sql).then(function(dbResp) {
      let ele = {};
      if (typeof dbResp[0] !== 'undefined') {
        ele = JSON.parse(dbResp[0]['DESCRIPTION']).elements;
      }
      resolve(ele);
    });
  });
}

/****
 * Parse the data returned from the DB.
 * And adds the scenarios to the cache
 */
function maintainCache(data) {
  for (var eleId in data) {
    let element = data[eleId];
    var dat = {
      Name: element.SCENARIO_NAME,
      Description: element.SCENARIO_DESC,
      graph: convertToConfig(element.CONFIG),
      tags: element.TAGS,
      Industry: '',
      Status: 'Completed'
    };
    masterCache[element.SCENARIO_ID] = dat;
  }
}

function convertToConfig(data) {
  let rtrn = data.split(`\r\n`).join(' ');
  let jsObj = JSON.parse(rtrn);
  return jsObj.config;
}

/****
 * takes a single element fetched from the DB and adds to the Cache
 */
function addtoCache(element) {
  masterCache[element.SCENARIO_ID] = {
    name: element.SCENARIO_NAME,
    description: element.SCENARIO_DESC,
    graph: element.CONFIG,
    tags: element.TAGS
  };
}

/*****************
 * Fetches and retruns the status of a particular scenario
 */
function getScnStatus(id, req) {
  let scnStats = scn.getScenarioStatus(id);
  if (!scnStats) {
    db.get(req, `SELECT * FROM "rhein.rheindb::USER_PROCESS_LOG" WHERE JOB_ID = "` + id + `"`).then(
      function(dbResp) {
        scnStats = dbResp[0];
        let scnConf = getScenario(scnStats.id, req);
        let tmpCon = scnConf.stats.current;
        scnConf.stats.history = tmpCon;
        scnConf.stats.current = scnStats;
        return scnConf;
      }
    );
  }
}

module.exports = {
  getScenarioStatus: getScnStatus,
  getScenarioList,
  getScenario,
  execScenario,
  sendStatus,
  sendLog
};
