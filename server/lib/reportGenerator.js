//var fs = require("fs");
var pdf = require('html-pdf');
var path = require('path');

var options = {
  format: 'A4',
  orientation: 'portrait',
  border: {
    top: '0px', // default is 0, units: mm, cm, in, px
    right: '15px',
    bottom: '0px',
    left: '5px'
  },
  base: 'file:///home/www/',
  paginationOffset: 1,
  //  header: {
  //    height: "15mm",
  //    contents: "<div><img src= './sap.png'/><hr/></div>"
  //  },
  footer: {
    height: '15mm',
    contents: {
      default:
        '<div style="text-align: right; padding-right:40px;"><hr/><span style="color: #444;text-align:center;">{{page}}</span>/<span>{{pages}}</span></div>'
    }
  }
};

function generateReport(config, eleInfo) {
  var imgSrc = 'file://' + __dirname + '/sap.png';
  imgSrc = path.normalize(imgSrc);
  var tble = getInfo(
    config['stats']['current'],
    config['description']
      .toString()
      .split('\r\n')
      .join('<br/>'),
    config['name']
  );

  var css = `html,body{
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 10;
    overflow:auto;
    display:block;
}
  table{
    border: 1px solid black;
    border-collapse: collapse;
    margin:15px;
    padding: 5px;
    white-space: pre-wrap;
    word-wrap: break-word;
    table-layout:fixed;
    max-width:720px;
  }
  td,th{
    border: 1px solid black;
    border-collapse: collapse;
    margin:15px;
    padding: 5px;
    overflow-x: auto;
    overflow-y:auto;
  }
  .header{
    max-width: 30%;
  }
  .data{
    color: black;
    background-color: white;
  }
  .Ok{
    color: green;
  }
  .Dead{
    color:red;
  }
  .Completed{
    color: green;
  }`;
  var body = getelementInfo(eleInfo);
  var info = getProdInfo(config['info']);
  var htmlBody =
    '<html><head><style>' +
    css +
    "</style></head><body><div id='pageHeader' style='text-align: right; padding-right:35px; height: 30px;'><img src= '" +
    imgSrc +
    "'/></div><div align='center' style='font-size:25;'><b>E2E Integration Suite - Test Report </b></div><div style='font-size:19;'><b>Graph Details</b></div>" +
    tble +
    "<div style='font-size:19;'><b>Version Details</b></div>" +
    info +
    "<div style='font-size:19;'><b>Run Details</b></div><div><b>Execution Sequence :</b>" +
    body['seqn'].replace('-->', '') +
    '</div>' +
    body['data'];
  ('</body></html>');
  pdf
    .create(htmlBody, options)
    .toFile('./data/' + config['stats']['current']['id'].toString() + '.pdf', function(err, res) {
      if (err) return console.log(err);
      console.log(res);
    });
  return htmlBody;
}
function getInfo(config, description, name) {
  var tData =
    '<table><tr><td colspan="2"><b>NAME:  </b>' +
    name.toString() +
    '</td></tr><tr><td colspan ="2"><b>DESCRIPTION:  </b>' +
    description.toString() +
    `</td></tr>
    <tr>
      <td><b>ID: </b>` +
    config['id'] +
    `</td>
      <td><b>Status: </b>` +
    config['status'] +
    `</td>
    </tr>
    <tr>
      <td><b>Init Time: </b>` +
    config['initTime'] +
    `</td>
      <td><b>Start Time: </b>` +
    config['startTime'] +
    `</td>
    </tr>
    <tr>
      <td><b>End Time: </b>` +
    config['endTime'] +
    `</td>
      <td><b>Message: </b>` +
    config['message'] +
    `</td>
    </tr> </table> `;
  return tData;
}
function getProdInfo(config) {
  var rtrnData = `<table>
  <tr>
    <th>System Name</th>
    <th>Product Version</th>
  </tr>`;
  for (var sys in config) {
    for (var it in config[sys]['item']) {
      rtrnData =
        rtrnData +
        `<tr><td>` +
        config[sys]['item'][it]['NAME'] +
        `</td><td>` +
        config[sys]['item'][it]['VERSION'] +
        `</td></tr>`;
    }
  }
  return rtrnData + '</table>';
}

function getelementInfo(elemInfo) {
  var seq = '';
  var htmlData = `<table>
  <tr>
    <th>Sequence</th>
    <th>System Name</th>
    <th>Runtime ID</th>
    <th>Status</th>
    <th>Start Time</th>
    <th>End Time</th>
  </tr>`;
  for (var ind in elemInfo) {
    seq = seq + `--->` + elemInfo[ind]['system'];
    htmlData =
      htmlData +
      '<tr><td>' +
      elemInfo[ind]['id'] +
      '</td ><td>' +
      elemInfo[ind]['system'] +
      '</td><td>' +
      elemInfo[ind]['jobId'] +
      '</td><td>' +
      elemInfo[ind]['status'] +
      '</td><td>' +
      elemInfo[ind]['startTime'] +
      '</td><td>' +
      elemInfo[ind]['endTime'] +
      '</td></tr>';
  }
  htmlData = htmlData + '</table>';
  return { seqn: seq, data: htmlData };
}

module.exports = { get: generateReport };
