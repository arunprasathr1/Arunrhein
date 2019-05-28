/*******************
 * Module with multiple utility functions,
 * that were used across in various modules
 */

/*****
 * Imports
 */
const crypto = require('crypto');
const fs = require('fs');

/*********
 * Makes the program to go to sleep for specified amount of milliseconds
 ***********/
function wait(millis) {
  const waitTill = new Date(new Date().getTime() + millis);
  while (waitTill > new Date());
}

/********
 * Checks if the file exists and returnd th efile object
 */
function getFile(path) {
  let data = fs.readFileSync(path);
  return data.toString('utf-8');
}

/******************
 * Delete a file
 */
function removeFile(path) {
  fs.unlinkSync(path);
}

/*********
 * Returns a unique 8 digit runtime Handle
 */
function getgraphId() {
  return crypto
    .randomBytes(8)
    .toString('hex')
    .toUpperCase();
}

/**********
 * Writes the data passed to the specified file.
 * Also converts the Json data to string before writing to file if specified in the ISJSON parameter of the function
 */
function putFile(path, data, isJson) {
  if (isJson) {
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
  } else {
    fs.writeFileSync(path, data);
  }
}

/*********
 * Checks if the file exists, returns true if exists
 */
function FileExists(path) {
  return fs.existsSync(path);
}

/**********
 * Return the value of the specified tag from given xml
 */
function xmlParser(srcString, tagName) {
  startIndex = srcString.indexOf('<' + tagName + '>');
  endIndex = srcString.indexOf('</' + tagName + '>');
  startIndex = startIndex + tagName.length + 2;
  return srcString.substring(startIndex, endIndex);
}

/********
 * Convert the XML string to a JSON object
 * Used to extract the version info from the API calls to any systems.
 */
function xmlToJson(xml) {
  var obj = {};

  if (xml.nodeType == 1) {
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) {
    obj = xml.nodeValue;
  }
  if (
    xml.hasChildNodes() &&
    xml.childNodes.length === 1 &&
    xml.childNodes[0].nodeType === 3 &&
    !obj['@attributes']
  ) {
    obj = xml.childNodes[0].nodeValue;
  } else if (xml.hasChildNodes()) {
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof obj[nodeName] == 'undefined') {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof obj[nodeName].push == 'undefined') {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

/*************
 * Parses the Sceanrio Config and builds individual element info
 */
function buildFromData(data) {
  var elements = {};
  for (var ind in data['graph']) {
    let key = data['graph'][ind];
    elements[key['id']] = {
      startTime: '--',
      endTime: '--',
      status: '--',
      jobId: 'NA',
      sysType: key['displayName'],
      config: key['config'] //getConfig(data['elements'][key]['config'])
    };
  }
  return elements;
}

/*********
 * parses Configuration of elemnt from file and returns as a dictionary
 */
function getConfig(data) {
  var config = {};
  for (var el in data) {
    config[data[el]['name']] = data[el]['value'];
  }
  return config;
}

/***********
 * Returns the type of system for the specified element
 */
function getSysType(data, sysId) {
  let conf = data['graph'].find(s => s.id === sysId);
  return conf['displayName'];
}

/*******
 * retuns a list with elements names in  the order of execution
 */
function getFlowOrder(data, pathConf) {
  let rtrnVal = [];
  let grFlow = data['graph'].sort((a, b) => (a.displaySequence || 0) - (b.displaySequence || 0));
  for (var ind in grFlow) {
    if (grFlow[ind]['displayName'] in pathConf && grFlow[ind]['config']['task'] !== '-') {
      let l = rtrnVal.push(grFlow[ind]['id']);
    }
  }
  return rtrnVal;
}

/************
 * Fetches and returns the Job ID from the response based on the system type
 * ********/
function fetchJobId(sysType, data) {
  var rtrnVal = '';
  switch (sysType) {
    case 'BW':
      rtrnVal = xmlParser(data.toString(), 'E_LOGID');
      break;
    case 'S4':
      rtrnVal = 'XXXX';
      break;
    case 'ERP':
      rtrnVal = 'XXXX';
      break;
    default:
      rtrnVal = 'XXXX';
  }
  return rtrnVal;
}

/************
 * Fetches and returns the Job status from the response based on the system type
 * ********/
function fetchJobStatus(sysType, data) {
  var rtrnVal = '';
  switch (sysType) {
    case 'BW':
      rtrnVal = xmlParser(data.toString(), 'MSGV3');
      break;
    case 'S4':
      rtrnVal = 'XXXX';
      break;
    case 'ERP':
      rtrnVal = 'XXXX';
      break;
    default:
      rtrnVal = 'XXXX';
  }
  return rtrnVal;
}

/**************
 * Updates the data section of the request headers with the Job name based on system type
 * **********/
function updateJobName(config, header) {
  var updatedHdr = '';
  switch (config['sysType']) {
    case 'BW':
      console.log(config['config']['task']);
      updatedHdr = header.split('&val&').join(config['config']['task']);
      break;
    case 'S4':
      updatedHdr = header.split('&val&').join(config['config']['task']);
      break;
    case 'ERP':
      updatedHdr = header.split('&val&').join(config['config']['task']);
      console.log(updatedHdr);
      break;
    default:
      updatedHdr = header;
  }
  return updatedHdr;
}

/****************
 * Updates the data section of the request headers with the Job name and Job ID based on system type
 * *****/
function updateJobId(config, jobId, header) {
  var updatedHdr = '';
  switch (config['sysType']) {
    case 'BW':
      updatedHdr = header
        .split('&val&')
        .join(config['config']['task'])
        .split('&val2&')
        .join(jobId);
      break;
    case 'S4':
      updatedHdr = header
        .split('&val&')
        .join(config['config']['task'])
        .split('&val2&')
        .join(jobId);
      break;
    case 'ERP':
      updatedHdr = header
        .split('&val&')
        .join(config['config']['task'])
        .split('&val2&')
        .join(jobId);
      break;
    default:
      updatedHdr = header;
  }
  return updatedHdr;
}

module.exports = {
  wait: wait,
  read: getFile,
  getgraphId: getgraphId,
  write: putFile,
  isFile: FileExists,
  getTagValue: xmlParser,
  buildFromData,
  getConfig,
  getSysType,
  getFlowOrder,
  fetchJobId,
  fetchJobStatus,
  updateJobName,
  updateJobId,
  xmlParser,
  xmlToJson,
  removeFile
};
