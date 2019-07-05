// Monitor connects to FI servers in docker images and check the state of tests.
// * If all tests are passing it exits with `0` code.
// * If there is a failure it exits with `1` error code.
// * If tests haven't finished in a defined timeout, it exits with `2` error code.
var axios = require('axios');
var querystring = require('querystring');
var fis = [
  {
    url: "http://localhost:8000/tests",
    online: false,
    tests: null
  },
  {
    url: "http://localhost:9000/tests",
    online: false,
    tests: null
  }
];
var started = false;

function checkStatus() {
  getTestsStatus(fis[0]);
  getTestsStatus(fis[1]);

  // If both FI1 are online, start timeout
  if (fis[0].online && fis[1].online) {
    var allSuccess = true;
    var allFinished = true;
    var pending = 0;

    for (var i = 0; i < fis.length; i++) {
      var fi = fis[i];
      if (fi.tests && Object.keys(fi.tests).length > 0) {
        for (var testName in fi.tests) {
          var status = fi.tests[testName];
          if (status == "fail") {
            allSuccess = false;
          }
          if (status == "pending") {
            allFinished = false;
            pending++;
          }
        }
      } else {
        allSuccess = false;
        allFinished = false;
      }
    }

    log("Pending tests: "+pending);

    if (allFinished) {
      if (allSuccess) {
        log("All tests pass!");
        process.exit();
      } else {
        log("Tests failed!");
        log(JSON.stringify(fis, null, 4));
        process.exit(1);
      }
    }

    if (!started) {
      started = true;
      // Trigger tests
      axios.post(fis[0].url);
      axios.post(fis[1].url);
      // Timeout
      setTimeout(function() {
        log("Tests timed out!");
        log(JSON.stringify(fis, null, 4));
        process.exit(2);
      }, 60*1000);
    }
  }
}

// Check status every few seconds
setInterval(checkStatus, 5000);

// Helper functions
function getTestsStatus(fi) {
  return axios.get(fi.url)
    .then(function(response) {
      fi.online = true;
      fi.tests = response.data;
    })
    .catch(function (response) {
      log("Monitor: Waiting for FIs to go online.");
      if (response.headers) {
        log("Error: "+response.headers.status);
      }
    });
}

function log(msg) {
  if (typeof msg === 'object') {
    msg = JSON.stringify(msg);
  }
  console.log("monitor     | "+msg)
}
