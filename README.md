[![Build Status](https://travis-ci.org/stellar/integration-tests.svg?branch=master)](https://travis-ci.org/stellar/integration-tests)

# Stellar Integration Tests

## FI 1

Service | Port
--------|-----
bridge | 8000
compliance external | 8001
compliance internal | 8002
FI server with proxed /auth | 8003

Type | Account
-----|--------
Receiving | GAAJKG3WQKHWZJ5RGVVZMVV6X3XYU7QUH2YVATQ2KBVR2ZJYLG35Z65A
Signing | GBAPTLS2A72RGEQIK6GQ4F74AIYFS2N7WIQ7LZOYKOJT4KD6MUQEHOEU

## FI 2

Service | Port
--------|-----
bridge | 9000
compliance external | 9001
compliance internal | 9002
FI server with proxed /auth | 9003

Type | Account
-----|--------
Receiving | GCNP7JE6KR5CKHMVVFTZJUSP7ALAXWP62SK6IMIY4IF3JCHEZKBJKDZF
Signing | GD4SMSFNFASBHPMCOJAOVYH47OXQM5BGSHFLKHO5BGRGUK6ZOAVDG54B

# TODO
- Use local horizon, stellar-core instead of SDF's instances.
- Test `mysql` storage for bridge and compliance.
