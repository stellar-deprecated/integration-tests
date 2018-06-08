import axios from 'axios';
import querystring from 'querystring';
import {Test, STATUS_SUCCESS, STATUS_FAIL} from './test'

export class CreditPaymentTest extends Test {
  constructor() {
    super();
    this.testName = "credit_payment";
  }

  start() {
    var queryParams = {
      use_compliance: true,
      id: this.testName,
      sender: this.testName + "*" + process.env.FI_DOMAIN,
      destination: this.testName + "*" + process.env.OTHER_FI_DOMAIN,
      asset_code: "TEST",
      asset_issuer: process.env.ISSUING_ACCOUNT,
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

    if (req.body.asset_code != "TEST") {
      this.printError("Invalid asset: "+req.body.asset_code+" "+req.body.asset_issuer)
      this.receiveStatus = STATUS_FAIL;
      return
    }

    this.receiveStatus = STATUS_SUCCESS;
  }
}
