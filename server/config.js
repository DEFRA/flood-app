const joi = require('@hapi/joi')

const defaultPort = 3009

// Define config schema
const schema = joi.object({
  restClientTimeoutMillis: joi.number().default(15000),
  port: joi.number().default(defaultPort),
  env: joi.string().valid('development', 'dev', 'test', 'tst', 'production').default('production'),
  stage: joi.string().default(''),
  serviceUrl: joi.string().uri().default('http://localhost:8050'),
  geoserverUrl: joi.string().uri().default('http://localhost:8080'),
  bingKeyMaps: joi.string().required(),
  bingKeyLocation: joi.string().required(),
  bingUrl: joi.string().uri().required(),
  nrwStationUrl: joi.string().uri().required(),
  ordnanceSurveyKey: joi.string().optional(),
  browserRefreshUrl: joi.string().optional(),
  httpTimeoutMs: joi.number().default(10000),
  gaAccId: joi.string().default(''),
  gaOptId: joi.string().default(''),
  fbAppId: joi.string().default(''),
  siteUrl: joi.string().default(`http://localhost:${defaultPort}`),
  floodRiskUrl: joi.string().default(`http://localhost:${defaultPort}`),
  sessionPassword: joi.string(),
  mockExternalHttp: joi.boolean().default(false),
  floodFisUrl: joi.string().default(`http://localhost:${defaultPort}`),
  localCache: joi.boolean().default(true),
  redisHost: joi.string().default(''),
  redisPort: joi.number().default(6379),
  redisPassword: joi.string().default('')
})

// Build config
const config = {
  restClientTimeoutMillis: 10000,
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  stage: process.env.FLOOD_APP_STAGE,
  serviceUrl: process.env.FLOOD_APP_SERVICE_URL,
  geoserverUrl: process.env.FLOOD_APP_GEOSERVER_URL,
  bingKeyMaps: process.env.FLOOD_APP_BING_KEY_MAP,
  bingKeyLocation: process.env.FLOOD_APP_BING_KEY_LOCATION,
  bingUrl: process.env.FLOOD_APP_BING_URL,
  nrwStationUrl: process.env.FLOOD_APP_NRW_STATION_URL,
  httpTimeoutMs: process.env.FLOOD_APP_HTTP_TIMEOUT,
  gaAccId: process.env.FLOOD_APP_GA_ID,
  gaOptId: process.env.FLOOD_APP_GA_OPT_ID,
  fbAppId: process.env.FLOOD_APP_FBAPP_ID,
  siteUrl: process.env.FLOOD_APP_SITE_URL,
  floodRiskUrl: process.env.FLOOD_RISK_URL,
  sessionPassword: process.env.FLOOD_APP_SESSION_PASSWORD,
  mockExternalHttp: process.env.FLOOD_APP_MOCK_EXTERNAL_HTTP,
  floodFisUrl: process.env.FLOOD_APP_FIS_URL,
  localCache: process.env.FLOOD_APP_LOCAL_CACHE,
  redisHost: process.env.FLOOD_APP_REDIS_HOST,
  redisPort: process.env.FLOOD_APP_REDIS_PORT,
  redisPassword: process.env.FLOOD_APP_REDIS_PASSWORD
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the joi validated value
const value = result.value

// Add some helper props
value.isDev = value.env !== 'production'
value.isProd = value.env === 'production'

module.exports = value
