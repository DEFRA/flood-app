[![Build Status](https://travis-ci.com/DEFRA/flood-app.svg?branch=master)](https://travis-ci.com/DEFRA/flood-app)[![Maintainability](https://api.codeclimate.com/v1/badges/07543b76346b60d1fa9d/maintainability)](https://codeclimate.com/github/DEFRA/flood-app/maintainability)[![Test Coverage](https://api.codeclimate.com/v1/badges/07543b76346b60d1fa9d/test_coverage)](https://codeclimate.com/github/DEFRA/flood-app/test_coverage)

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
| NODE_ENV | Node environment |    no    | dev | dev, tst, prd |                               |
| PORT     | Port number      |    no    | 3009    |                             |                               |
| FLOOD_APP_SERVICE_URL   | flood-service  |    yes    |         |                             | For flood api |
| FLOOD_APP_BING_KEY   | MS Bing Key  |    yes    |         |                             | For location search |
| FLOOD_APP_GEOSERVER_URL   | Geoserver  |    yes    |         |                             | For maps ows |
| FLOOD_APP_HTTP_TIMEOUT   | Http timeout  |    no    |  10000 (10s)       |                             | For maps ows |
| HTTPS_PROXY   | Proxy address |    no    |         |                             | For external api calls |
| FLOOD_APP_GA_ID   | Google analytics Id |    no    |    ''     |                             |  |
| FLOOD_APP_FBAPP_ID   | Facebook AppId |    no    |    ''     |                             |  |
| FLOOD_APP_SITE_URL   | Site Url  |    no    | http://localhost:3009 |                             | For SEO metadata |
| FLOOD_APP_ERRBIT_POST_ERRORS | Errbit activation |    no    |   true, false   |  |       |
| FLOOD_APP_ERRBIT_ENV     | Errbit env      |    no    |     ||       |
| FLOOD_APP_ERRBIT_KEY | Errbit key |    no    |         |  |       |
| FLOOD_APP_ERRBIT_HOST     | Errbit host      |    no    |     ||       |
| FLOOD_APP_ERRBIT_PROXY  | Errbit proxy |    no    | ''    ||       |
