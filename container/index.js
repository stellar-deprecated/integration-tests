var querystring = require('querystring');
var express = require('express');
var proxy = require('express-http-proxy');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var axios = require('axios');

var tests = {
  send: {status: "pending"},
  sendNative: { status: "pending" },
  receive: {status: "pending"},
  receiveNative: { status: "pending" }
};

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

  // TODO more tests
  res.send({
    account_id: process.env.RECEIVING_ACCOUNT,
    memo_type: "id",
    memo: "1"
  });
});

// receive callback
app.post('/receive', function (req, res) {
  console.log("/receive callback: "+JSON.stringify(req.body));
  res.send("OK");
  assertReceiveTest(req.body);
});

// sanctions callback
app.post('/sanctions', function (req, res) {
  console.log("/sanctions callback: "+JSON.stringify(req.body));
  res.send("OK");
});

// ask_user callback
app.post('/ask_user', function (req, res) {
  console.log("/ask_user callback: "+JSON.stringify(req.body));
  res.send("OK");
});

// fetch_info callback
app.post('/fetch_info', function (req, res) {
  console.log("/fetch_info callback: "+JSON.stringify(req.body));
  res.send({
    first_name: "John",
    middle_name: process.env.FI_DOMAIN,
    last_name: "Doe",
    address: "User physical address",
    date_of_birth: "1980-01-01"
  });
});

// Endpoint for monitoring app. Simply returns tests status.
app.get('/tests', function (req, res) {
  res.send(tests);
});

// Endpoint to trigger tests called by monitoring app when
// both FIs are online.
app.post('/tests', function (req, res) {
  sendPayment("TEST");
  if (doNativeTest(process.env.BRIDGE_VERSION) && doNativeTest(process.env.OTHER_FI_BRIDGE_VERSION)) {
    sendPayment("XLM");
  }
  res.send("OK");
});

app.listen(process.env.FI_PORT, function () {
  console.log('Server listening!')
});

function sendPayment(assetCode) {
  // Check if the other FI is online already. If not repeat after 5 seconds.
  console.log("Sending payment to "+process.env.OTHER_FI_DOMAIN+"...")
  var queryParams = {
    // Use compliance protocol
    use_compliance: true,
    sender: "sender*" + process.env.FI_DOMAIN,
    destination: "user1*" + process.env.OTHER_FI_DOMAIN,
    amount: 1
  };
  var testName = "sendNative";
  
  if (assetCode != "XLM") {
    queryParams.asset_code = assetCode;
    queryParams.asset_issuer = process.env.ISSUING_ACCOUNT;
    testName = "send";
  }

  var query = querystring.stringify(queryParams);
  axios.post("http://localhost:"+process.env.BRIDGE_PORT+"/payment", query)
    .then(function(response) {
      console.log(response.data);
      passTest(testName);
    })
    .catch(function (response) {
      console.error("Error: "+response.headers.status);
      console.error(response.data);
      failTest(testName, response.data);
    });
}

function assertReceiveTest(body) {
  var testName = "receiveNative";
  if(body.asset_code){
    testName = "receive";
  }

  if (body.from == process.env.RECEIVING_ACCOUNT) {
    return failTest(testName, "Received from itself!");
  }

  if (body.route != 1) {
    return failTest(testName, "Invalid route: "+body.route);
  }

  if (body.amount !== "1.0000000") {
    return failTest(testName, "Invalid amount: "+body.amount);
  }

  if (body.asset_code) {
    if (body.asset_code !== "TEST") {
      return failTest(testName, "Invalid asset_code: " + body.asset_code);
    }
  }
  
  let data = JSON.parse(body.data);

  if (data.sender !== "sender*"+process.env.OTHER_FI_DOMAIN) {
    return failTest(testName, "Invalid data.sender: "+data.sender);
  }

  let attachment = JSON.parse(data.attachment);
  let expectedAttachmentTransaction = {
    // sender_info keys will be sorted alphabetically (Go map)
    sender_info: {
      address: "User physical address",
      date_of_birth: "1980-01-01",
      first_name: "John",
      last_name: "Doe",
      middle_name: process.env.OTHER_FI_DOMAIN
    },
    route: "1",
    note: "",
    extra: ""
  };

  if (JSON.stringify(attachment.transaction) != JSON.stringify(expectedAttachmentTransaction)) {
    return failTest(testName, "Invalid attachment.transaction: "+JSON.stringify(attachment.transaction)+" expected: "+JSON.stringify(expectedAttachmentTransaction));
  }

  passTest(testName);
}

function failTest(testName, error) {
  tests[testName].status = "fail";
  tests[testName].error = error;
}

function passTest(testName) {
  tests[testName].status = "success";
}

function doNativeTest(bridgeVersion){
  if (bridgeVersion == "master") {
    return true;
  }
  var bridgeVersions = bridgeVersion.split(".");
  bridgeVersions[0] = bridgeVersions[0].slice(1);
  if (bridgeVersions[2] > 30 || bridgeVersions[1] > 0 || bridgeVersions[0] > 0) {
    return true;
  }
  return false;
}