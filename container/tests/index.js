import {CreditPaymentTest} from './credit_payment_test';
import {PendingTest} from './pending_test';
import {XlmPaymentTest} from './xlm_payment_test';

let tests = [
  new CreditPaymentTest(),
  new PendingTest(),
  new XlmPaymentTest(),
];

// testName => testObject map
let testsByName = {};

for (let test of tests) {
  if (!checkVersion(process.env.BRIDGE_VERSION, test.getRequiredVersion()) ||
    !checkVersion(process.env.OTHER_FI_BRIDGE_VERSION, test.getRequiredVersion())) {
    continue;
  }
  
  testsByName[test.getTestName()] = test;
}
module.exports = testsByName;

function checkVersion(currentVersion, requiredVersion) {
  if (currentVersion == "master") {
    return true;
  }

  if (!requiredVersion) {
    return true;
  }

  var required = requiredVersion.split(".");
  required[0] = required[0].slice(1); // remove `v` prefix

  var current = currentVersion.split(".");
  current[0] = current[0].slice(1); // remove `v` prefix
  
  if (required[0] > current[0]) {
    return false;
  }

  if (required[1] > current[1]) {
    return false;
  }

  if (required[2] > current[2]) {
    return false;
  }

  return true;
}
