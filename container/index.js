require("babel/register");
var _ = require('lodash');
var querystring = require('querystring');
var express = require('express');
var proxy = require('express-http-proxy');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var tests = require('./tests');

app.use(morgan('dev'));

// We forward auth requests to bridge server instead of creating another
// ngrok tunnel to bridge server port.
app.use('/auth', proxy('http://localhost:'+process.env.COMPLIANCE_EXTERNAL_PORT));

app.use(bodyParser.urlencoded({extended: false}));

const stellarToml = '# Stellar.toml\n'+
  'FEDERATION_SERVER="https://'+process.env.FI_DOMAIN+'/federation"\n'+
  'AUTH_SERVER="https://'+process.env.FI_DOMAIN+'/auth"\n'+
  'SIGNING_KEY="'+process.env.SIGNING_ACCOUNT+'"\n';

// stellar.toml
app.get('/.well-known/stellar.toml', function (req, res) {
  res.set('Content-Type', 'text/x-toml');
  res.set('Access-Control-Allow-Origin', '*');
  res.send(stellarToml);
})

// federation
app.get('/federation', function (req, res) {
  if (req.query.type != "name") {
    res.status(400).send('Invalid type');
    return
  }

  if (!req.query.q) {
    res.status(400).send('Invalid q');
    return
  }

  res.set('Content-Type', 'application/json');
  res.set('Access-Control-Allow-Origin', '*');

  let destination = req.query.q.split('*');
  let testName = destination[0];
  let test = tests[testName];
  test.getFederation(req, res);
});

// receive callback
app.post('/receive', function (req, res) {
  let test = tests[req.body.route];
  test.onReceive(req, res);
});


// sanctions callback
app.post('/sanctions', function (req, res) {
  console.log("/sanctions callback: "+JSON.stringify(req.body));
  let sender = JSON.parse(req.body.sender);
  let testName = sender.middle_name;
  let test = tests[testName];
  test.onSanctions(req, res);
});

// ask_user callback
app.post('/ask_user', function (req, res) {
  console.log("/ask_user callback: "+JSON.stringify(req.body));
  let sender = JSON.parse(req.body.sender);
  let testName = sender.middle_name;
  let test = tests[testName];
  test.onAskUser(req, res);
});

// fetch_info callback
app.post('/fetch_info', function (req, res) {
  console.log("/fetch_info callback: "+JSON.stringify(req.body));
  let address = req.body.address.split('*');
  let testName = address[0];
  let test = tests[testName];
  test.onFetchInfo(req, res);
});

// Endpoint for monitoring app. Simply returns tests status.
app.get('/tests', function (req, res) {
  res.send(_.mapValues(tests, test => test.getStatus()));
});

// Endpoint to trigger tests called by monitoring app when
// both FIs are online.
app.post('/tests', function (req, res) {
  for (let testName in tests) {
    let test = tests[testName];
    test.start();
  }
  res.send("OK");
});

app.listen(process.env.FI_PORT, function () {
  console.log('Server listening!')
});
