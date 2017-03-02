[![Build Status](https://travis-ci.org/stellar/integration-tests.svg?branch=master)](https://travis-ci.org/stellar/integration-tests)

# Stellar Integration Tests

This repository contains script responsible for performing integration tests of different components of the Stellar network.

## Architecture

This section describes the architecture of integration tests.

### Architecture Diagram
![Diagram](diagram.png)

### Components

#### Monitor

Monitor (`monitor.js`) is the main app run by travis. It's responsible for:
* Starting tests when both FI server are online.
* Checking the current status of tests and returning the correct exit code if tests succeed/fail/timeout.

#### ngrok

[ngrok](https://ngrok.com/) allows creating http/https tunnels to Docker containers. This allows us to expose `stellar.toml`, federation server and auth server to the internet so other FI can access them.

#### FI Container

FI Container is built from docker image that can be found in `container` directory. It consists of:
* [Bridge](https://github.com/stellar/bridge-server/blob/master/readme_bridge.md) server,
* [Compliance](https://github.com/stellar/bridge-server/blob/master/readme_compliance.md) server,
* Custom FI server (`index.js`). It provides:
  * Callbacks for `bridge` and `compliance` servers.
  * Callbacks for `monitor` to start tests and check tests status.
  * Proxy to `compliance` auth server (to allow creating a single tunnel to docker container).
  * Tests code.

Services are listening on the following ports within a docker container:

Service | Port | Exposed to docker host?
--------|------|------------------------
bridge | 8000 | No
compliance external | 8001 | No
compliance internal | 8002 | No
FI server with proxy to `compliance` auth server | 8003 | **Yes**

#### DB Container

Docker container with a DB server that provides storage for `bridge` and `compliance` servers.

## Configuration

Docker cluster is defined in `docker-compose.yml` and can be started using `docker-compose` command.

`docker-compose` is using environment variables defined in `container1.env`, `container2.env` and secret variables set in Travis. The list of environment variables can be found below:

Description | Scope | Name | Value
------------|-------|------|-------
Ngrok Auth Token | Global | `NGROK_AUTH_TOKEN` | _secret_
F1 Domain | Global | `FI1_DOMAIN` | _random_
F2 Domain | Global | `FI2_DOMAIN` | _random_
F1 Bridge version | Global | `FI1_BRIDGE_VERSION` | Defined in .travis.yml: `master` - master branch, other values define release version 
F2 Bridge version | Global | `FI2_BRIDGE_VERSION` | Defined in .travis.yml: `master` - master branch, other values define release version
FI1 Receiving account | container1.env | `RECEIVING_ACCOUNT` | `GAAJKG3WQKHWZJ5RGVVZMVV6X3XYU7QUH2YVATQ2KBVR2ZJYLG35Z65A`
FI1 Receiving secret | Global | `FI1_RECEIVING_SEED` | _secret_
FI1 Signing account | container1.env | `SIGNING_ACCOUNT` | `GBAPTLS2A72RGEQIK6GQ4F74AIYFS2N7WIQ7LZOYKOJT4KD6MUQEHOEU`
FI1 Signing secret | Global | `FI1_SIGNING_SEED` | _secret_
FI2 Receiving account | container2.env | `RECEIVING_ACCOUNT` | `GCNP7JE6KR5CKHMVVFTZJUSP7ALAXWP62SK6IMIY4IF3JCHEZKBJKDZF`
FI2 Receiving secret | Global | `FI2_RECEIVING_SEED` | _secret_
FI2 Signing account | container2.env | `SIGNING_ACCOUNT` | `GD4SMSFNFASBHPMCOJAOVYH47OXQM5BGSHFLKHO5BGRGUK6ZOAVDG54B`
FI2 Signing secret | Global | `FI2_SIGNING_SEED` | _secret_
Issuing account | container*.env | `ISSUING_ACCOUNT` | `GDNFUWF2EO4OWXYLI4TDEH4DXUCN6PB24R6XQW4VATORK6WGMHGRXJVB`

## Tests flow

See `script.sh`.

1. Build `container` docker image using files in `container` directory.
1. Generate random ngrok subdomains for FIs and start ngrok.
1. Start a cluster by `docker-compose up`.
1. Start `monitor` app.
  1. Wait for **both** FIs to go online.
  1. When **both** FIs are working start tests.
  1. Monitor current status of tests.
  1. Print results and exit with correct (error) code.

## TODO

* More test scenarios.
* Test `mysql` storage for bridge and compliance.
* Use `docker-stellar-core-horizon` instead of SDF's instances.
