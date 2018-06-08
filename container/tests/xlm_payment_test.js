import axios from 'axios';
import querystring from 'querystring';
import {Test, STATUS_SUCCESS, STATUS_FAIL} from './test'

export class XlmPaymentTest extends Test {
  constructor() {
    super();
    this.testName = "xlm_payment";
    this.requiredVersion = "v0.0.31";
  }

  start() {
    var queryParams = {
      use_compliance: true,
      id: this.testName,
      sender: this.testName + "*" + process.env.FI_DOMAIN,
      destination: this.testName + "*" + process.env.OTHER_FI_DOMAIN,
      amount: 1
    };

    var query = querystring.stringify(queryParams);
    axios.post("http://localhost:"+process.env.BRIDGE_PORT+"/payment", query)
      .then(response => {
        this.sendStatus = STATUS_SUCCESS;
      })
      .catch(error => {
        this.receiveStatus = STATUS_FAIL;
        this.printError(error);
      });
  }

  onReceive(req, res) {
    super.onReceive(req, res);

    // Standard tests failed
    if (this.receiveStatus == STATUS_FAIL) {
      return;
    }

    if (req.body.asset_code) {
      this.printError("Invalid asset_code: " + req.body.asset_code)
      this.receiveStatus = STATUS_FAIL;
      return
    }

    this.receiveStatus = STATUS_SUCCESS;
  }
}
