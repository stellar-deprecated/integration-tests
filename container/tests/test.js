export const STATUS_SUCCESS = "success";
export const STATUS_PENDING = "pending";
export const STATUS_FAIL = "fail";

export class Test {
  constructor() {
    this.sendStatus = STATUS_PENDING;
    this.receiveStatus = STATUS_PENDING;
  }

  start() {
    throw new Error("start is abstract method");
  }

  getTestName() {
    return this.testName;
  }

  printError(error) {
    console.error(this.testName+" error: "+error)
  }

  getStatus() {
    if (this.sendStatus == STATUS_PENDING || this.receiveStatus == STATUS_PENDING) {
      return STATUS_PENDING;
    }

    if (this.sendStatus == STATUS_FAIL || this.receiveStatus == STATUS_FAIL) {
      return STATUS_FAIL;
    }

    return STATUS_SUCCESS;
  }

  getRequiredVersion() {
    if (this.requiredVersion && this.requiredVersion.charAt(0) != 'v') {
      throw new Error("Required version must have `v` prefix.");
    }
    return this.requiredVersion;
  }

  onReceive(req, res) {
    res.send("OK");
    let body = req.body;

    if (body.from == process.env.RECEIVING_ACCOUNT) {
      this.receiveStatus = STATUS_FAIL;
      this.printError("Received from itself!");
      return;
    }

    if (body.route != this.testName) {
      this.receiveStatus = STATUS_FAIL;
      this.printError("Invalid route: "+body.route);
      return;
    }

    if (body.amount !== "1.0000000") {
      this.receiveStatus = STATUS_FAIL;
      this.printError("Invalid amount: "+body.amount);
      return;
    }
    
    let data = JSON.parse(body.data);

    if (data.sender !== this.testName+"*"+process.env.OTHER_FI_DOMAIN) {
      this.receiveStatus = STATUS_FAIL;
      this.printError("Invalid data.sender: "+data.sender);
      return;
    }

    let attachment = JSON.parse(data.attachment);
    let expectedAttachmentTransaction = {
      // sender_info keys will be sorted alphabetically (Go map)
      sender_info: {
        address: "User physical address",
        date_of_birth: "1980-01-01",
        first_name: "John",
        last_name: "Doe",
        middle_name: this.testName
      },
      route: this.testName,
      note: "",
      extra: ""
    };

    if (JSON.stringify(attachment.transaction) != JSON.stringify(expectedAttachmentTransaction)) {
      this.receiveStatus = STATUS_FAIL;
      this.printError("Invalid attachment.transaction: "+JSON.stringify(attachment.transaction)+" expected: "+JSON.stringify(expectedAttachmentTransaction));
      return;
    }
  }

  // `memo` should always equal `this.testName`
  getFederation(req, res) {
    res.send({
      account_id: process.env.RECEIVING_ACCOUNT,
      memo_type: "text",
      memo: this.testName
    });
  }

  onSanctions(req, res) {
    res.send("OK");
  }

  onAskUser(req, res) {
    res.send("OK");
  }

  onFetchInfo(req, res) {
    res.send({
      first_name: "John",
      // Used to route a request to /sanctions and /ask_user to correct test
      middle_name: this.testName,
      last_name: "Doe",
      address: "User physical address",
      date_of_birth: "1980-01-01"
    });
  }
}
