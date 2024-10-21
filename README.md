# bsky-lookup
Lookup all DNS records of bluesky handle on Cloudflare and display a landing page using Cloudflare Workers.

# Usage
Create a new worker. Open `worker.js`, copy source code and paste into worker editor. Then deploy.

Set the following variables:

* `CLOUDFLARE_API_KEY`: API key for reading DNS records
* `ZONE_ID_EXAMPLE_COM`: Uppercase your domain and replace `.` and `-` into `_` (`example.com` -> `EXAMPLE_COM`). Add `ZONE_ID_` prefix to get variable name. Variable value is zone ID (NOT account ID) copied from Cloudflare zone dashboard.
