[![Build Status](https://travis-ci.com/DEFRA/flood-app.svg?branch=master)](https://travis-ci.com/DEFRA/flood-app)[![Maintainability](https://api.codeclimate.com/v1/badges/07543b76346b60d1fa9d/maintainability)](https://codeclimate.com/github/DEFRA/flood-app/maintainability)[![Test Coverage](https://api.codeclimate.com/v1/badges/07543b76346b60d1fa9d/test_coverage)](https://codeclimate.com/github/DEFRA/flood-app/test_coverage)

# flood-app

This is the front end application to check the flooding service

## Getting started

### Prerequisites

Running flood-db: https://github.com/DEFRA/flood-db
Running flood-gis: https://github.com/DEFRA/flood-gis
Running flood-service: https://github.com/DEFRA/flood-service

Node.js v12.x.x

### Testing the application
```
$ npm i
$ npm run test
```

Functional testing: https://github.com/DEFRA/flood-service-tests-v2

### Running the application

Once the environment variables below are set, you are now ready to start:

```
$ npm i
$ node index.js
```

Go to http://localhost:3009

# Environment variables

DEFRA employees can find examples of environment variables stored in our private gitlab repository

| name     | description      | required | default |            valid            |             notes             |
|----------|------------------|:--------:|---------|:---------------------------:|:-----------------------------:|
| NODE_ENV | Node environment |    no    | production | development, dev, test, tst, production |                               |
| FLOOD_APP_STAGE | Flavour of environment | no | '' | ||
| PORT     | Port number      |    no    | 3009    |                             |                               |
| FLOOD_APP_BING_KEY_MAP   | MS Bing Key  |    yes    |         |                             | For location search |
| FLOOD_APP_BING_KEY_LOCATION   | MS Bing Key  |    yes    |         |                             | For location search |
| FLOOD_APP_BING_URL   | MS Bing Location Search  |    yes    |         |                             | For location search |
| FLOOD_APP_GEOSERVER_URL   | Geoserver  |    yes    |         |                             | For maps ows |
| FLOOD_APP_SERVICE_URL   | flood-service  |    yes    |         |                             | For flood api |
| FLOOD_APP_GA_ID   | Google analytics Id |    no    |         |                             |  |
| FLOOD_APP_NRW_STATION_URL | NRW station search  | yes | https://rloi.naturalresources.wales/ViewDetails?station= | |
| FLOOD_APP_SITE_URL   | Site Url  |    yes    | http://localhost:3009 |                             | For SEO metadata |
| FLOOD_RISK_URL   | Flood risk Url  |    yes    |  |                             | To link to correct flood risk environment |
| FLOOD_APP_FIS_URL   | Flood Information Service Url  |    yes    |  |                             | To link to correct flood information sevrvice environment |
| FLOOD_APP_SESSION_PASSWORD | cookie password | yes | | |
| FLOOD_APP_REDIS_HOST | redis cache host | no | | |  |
| FLOOD_APP_REDIS_PORT | redis cache port | no | | |  |
| FLOOD_APP_LOCAL_CACHE | to cache or not | no | false | |  |
| FLOOD_APP_GA_OPT_ID | google opt id | no | | |  |



