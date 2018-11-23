# flood-app

## Getting started

### Prerequisites
Install Node.js v8.x.x

### Clone and build

Clone this repo

`$ git clone https://github.com/DEFRA/flood-app`

`$ cd flood-app/`


Install dependencies

`$ npm i`


ONce the environment variables below are set, you are now ready to start:

`$ node index.js`


Open your browser at

`http://localhost:3009`

# Environment variables

| name     | description      | required | default |            valid            |             notes             |
|----------|------------------|:--------:|---------|:---------------------------:|:-----------------------------:|
| NODE_ENV | Node environment |    no    | development | development, test, production |                               |
| PORT     | Port number      |    no    | 3009    |                             |                               |
| FLOOD_APP_SERVICE_URL   | flood-service  |    yes    |         |                             | For flood api |
| FLOOD_APP_BING_KEY   | MS Bing Key  |    yes    |         |                             | For location search |
| FLOOD_APP_GEOSERVER_URL   | Geoserver  |    yes    |         |                             | For maps ows |
| FLOOD_APP_HTTP_TIMEOUT   | Http timeout  |    no    |  10000 (10s)       |                             | For maps ows |
| HTTPS_PROXY   | Proxy address |    no    |         |                             | For external api calls |
