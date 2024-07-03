Changes

* Manifest.json
- background->persistent: false
- add background->webRequestShim.js
- permissions->remove webRequest 
- add permissions->"*://*.webrequestproxy.workerify.workers.dev/*"

* background.js
- line 2 add setupWebRequestShim(ext_api)