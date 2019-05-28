/********
 * Imports
 */
const express = require('express');
const path = require('path');
const winston = require('winston');
const sc = require('./lib/scenario');
const UserAuth = require('./lib/Conn/UserAuth');
const hdbext = require('@sap/hdbext');
const xssec = require('@sap/xssec');
const log = require('./lib/logger');
const passport = require('passport');
const mw = require('./lib/middleware');
const xsenv = require('@sap/xsenv');

const app = express();
app.use(express.json());

/****************
 * Integrate DB as the application middleware
 */
var hanaOptions = xsenv.getServices({
  hana: {
    tag: 'hana'
  }
});
app.use(hdbext.middleware(hanaOptions.hana));

/****************
 * Use the XSUAA service to authenticate the User
 */
passport.use('JWT', new xssec.JWTStrategy(xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', { session: false }));

app.use(express.static(path.join('../client/build')));

/******
 * Inital call, will return the UI html
 */
app.get('/', function(req, res) {
  console.log(hanaOptions);
  res.sendFile(path.join('../client/build/index.html'));
});

/*******
 * Returns the list of scenario's the user has access to
 */
app.get('/api/scenarios', (req, res) => {
  mw.getScenarioList(req, res);
});

/**************
 * returns the JSON config and previous run details for a given scenario
 */
app.get('/api/getScenario/:id', (req, res) => {
  mw.getScenario(req.params.id, req, res);
});

/*********************
 * Update the connection details to DB
 */
app.put('/api/config/:scenario/:sysId', (req, res) => {});

/***************
 * Executes a given scenario
 */
app.get('/api/exec/:id', async (req, res) => {
  console.log('Executing');
  await mw.execScenario(req.params.id, req, res);
  //res.json(config);
});

/*********
 * Returns the log of last run for the particular scenario based on the user
 */
app.get('/api/getLog/:id', (req, res) => {
  console.log('Call for logs');
  mw.sendLog(req.params.id, req, res);
});

app.get('/api/getStatus/:id', (req, res) => {
  console.log('Call for status');
  mw.sendStatus(req.params.id, req, res);
});

/*************
 * Returns a generic report based on all the previous runs.
 */
app.get('/api/getReport/:id', (req, res) => {});

app.get('/api/getRe', (req, res) => {
  console.log('I am getting screwed');
});

/*********
 * Makes the app run and listen to port 8080  for any api calls that were being made.
 */
app.listen(8080, function() {
  console.log('Server App Listening on port 8080');
});
