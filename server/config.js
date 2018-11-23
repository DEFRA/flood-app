const joi = require('joi')

const defaultPort = 3009

// Define config schema
const schema = {
  port: joi.number().default(defaultPort),
  env: joi.string().valid('development', 'test', 'production').default('development'),
  serviceUrl: joi.string().uri().default('http://localhost:8050'),
  geoserverUrl: joi.string().uri().default('http://localhost:8080'),
  bingKey: joi.string().required(),
  ordnanceSurveyKey: joi.string().optional(),
  browserRefreshUrl: joi.string().optional(),
  httpsProxy: joi.string().uri().default(''),
  httpTimeoutMs: joi.number().default(10000),
  fbAppId: joi.string().default(''),
  siteUrl: joi.string().default(`http://localhost:${defaultPort}`)
}

// Build config
const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  serviceUrl: process.env.FLOOD_APP_SERVICE_URL,
  geoserverUrl: process.env.FLOOD_APP_GEOSERVER_URL,
  bingKey: process.env.FLOOD_APP_BING_KEY,
  httpsProxy: process.env.HTTPS_PROXY,
  httpTimeoutMs: process.env.FLOOD_APP_HTTP_TIMEOUT,
  fbAppId: process.env.FLOOD_APP_FBAPP_ID,
  siteUrl: process.env.FLOOD_APP_SITE_URL
}

// Validate config
const result = joi.validate(config, schema, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the joi validated value
const value = result.value

// Add some helper props
value.isDev = value.env === 'development'
value.isProd = value.env === 'production'

module.exports = value
