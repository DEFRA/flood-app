![Build status](https://github.com/DEFRA/flood-app/actions/workflows/ci.yml/badge.svg)[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_flood-app&metric=alert_status)](https://sonarcloud.io/dashboard?id=DEFRA_flood-app)[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_flood-app&metric=coverage)](https://sonarcloud.io/dashboard?id=DEFRA_flood-app)

# flood-app

This is the front end application to check the flooding service

## Getting started

### Prerequisites

Running flood-db: https://github.com/DEFRA/flood-db
Running flood-gis: https://github.com/DEFRA/flood-gis
Running flood-service: https://github.com/DEFRA/flood-service

Node.js v16.x.x

### Testing the application

Before running tests, ensure that your environment variables are set.


```
$ npm i
$ npm run test
```

Functional testing: https://github.com/DEFRA/flood-service-tests-v2

### Running the application

Before running the applciation, ensure that your environment variables are set.

```
$ npm i
$ node index.js
```

Go to http://localhost:3009

### Developing the application

When making changes to the application, bear in mind that certain aspects and components are only updated when you perform the **npm run build** stage.

If your changes are not reflected in the browser/console, you should check this first.

# Environment variables

Create a .env file at the root of the project to set your environment variables locally, which is especially useful during development. The [dotenv](https://www.npmjs.com/package/dotenv) package facilitates this by automatically loading these variables at application start. This approach is recommended as a simpler alternative to global settings, like those in .bashrc. 

For DEFRA employees, examples of these environment variables are available in our private lfwconfig repository.

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
| FLOOD_APP_GA4_ID   | Google analytics 4 Id |    no    |         |                             |  |
| FLOOD_APP_GTM_ID   | Google Tag Manager Id |    no    |         |                             |  |
| FLOOD_APP_NRW_STATION_URL | NRW station search  | yes | https://rivers-and-seas.naturalresources.wales/Station/ | |
| FLOOD_APP_SITE_URL   | Site Url  |    yes    | http://localhost:3009 |                             | For SEO metadata |
| FLOOD_RISK_URL   | Flood risk Url  |    yes    |  |                             | To link to correct flood risk environment |
| FLOOD_APP_FIS_URL   | Flood Information Service Url  |    yes    |  |                             | To link to correct flood information sevrvice environment |
| FLOOD_APP_SESSION_PASSWORD | cookie password | yes | | |
| FLOOD_APP_REDIS_HOST | redis cache host | no | | |  |
| FLOOD_APP_REDIS_PORT | redis cache port | no | | |  |
| FLOOD_APP_REDIS_PASSWORD | redis cache password | no | | | |
| FLOOD_APP_LOCAL_CACHE | to cache or not | no | false | |  |
| FLOOD_APP_GA_OPT_ID | google opt id | no | | |  |
| FLOOD_APP_RATE_LIMIT_ENABLED | rate limit  | no | false | | If set to true then all rate limit envvars need to be valid |
| FLOOD_APP_RATE_LIMIT_REQUESTS | rate limit  | no | | Number of total requests that can be made on a given path per user per period. Set to false to disable limiting requests per path per user. |  |
| FLOOD_APP_RATE_LIMIT_EXPIRES_IN | rate limit  | no | | Time (in milliseconds) of period for number of total requests |  |
| FLOOD_APP_RATE_LIMIT_WHITELIST | rate limit white-listed ip addresses | no | | Colon separated list of IPs to bypass rate limiting e.g. '1.1.1.1:2.2.2.2' |  |


