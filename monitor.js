// Monitor connects to FI servers in docker images and check the state of tests.
// * If all tests are passing it exits with `0` code.
// * If there is a failure it exists with `1` error code.
// * If tests haven't finished in a defined timeout, it exists with `2` error code.
var axios = require('axios');
var fis = [
  {
    url: "http://192.168.99.100:8000/tests",
    online: false,
    tests: null
  },
  {
    url: "http://192.168.99.100:9000/tests",
    online: false,
    tests: null
  }
];
var startedTimeout = false;

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
      if (fi.tests) {
        for (var testName in fi.tests) {
          var test = fi.tests[testName];
          if (test.status == "fail") {
            allSuccess = false;
          }
          if (test.status == "pending") {
            allFinished = false;
            pending++;
          }
        }
      } else {
        allSuccess = false;
        allFinished = false;
      }
    }

    console.log("Pending tests: "+pending);

    if (allFinished) {
      if (allSuccess) {
        console.log("All tests pass!");
        process.exit();
      } else {
        console.log("Tests failed!");
        console.log(JSON.stringify(fis, null, 4));
        process.exit(1);
      }
    }

    if (!startedTimeout) {
      startedTimeout = true
      setTimeout(function() {
        console.error("Tests timed out!");
        console.log(JSON.stringify(fis, null, 4));
        process.exit(2);
      }, 60*1000);
    }
  }
}

// Check status every second
setInterval(checkStatus, 5000);

// Helper functions
function getTestsStatus(fi) {
  return axios.get(fi.url)
    .then(function(response) {
      fi.online = true;
      fi.tests = response.data;
    })
    .catch(function (response) {
      console.error("Monitor: Error connecting to FI");
      if (response.headers) {
        console.error("Error: "+response.headers.status);
      }
    });
}
