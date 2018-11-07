const joi = require('joi')

// Define config schema
const schema = {
  port: joi.number().default(3009),
  env: joi.string().valid('development', 'test', 'production').default('development'),
  serviceUrl: joi.string().uri().default('http://localhost:8050'),
  geoserverUrl: joi.string().uri().default('http://localhost:8080'),
  bingKey: joi.string().required(),
  date: joi.number().optional(),
  ordnanceSurveyKey: joi.string().optional(),
  browserRefreshUrl: joi.string().optional()
}

// Build config
const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  date: process.env.FLOOD_APP_DATE,
  serviceUrl: process.env.FLOOD_APP_SERVICE_URL,
  geoserverUrl: process.env.FLOOD_APP_GEOSERVER_URL,
  bingKey: process.env.FLOOD_APP_BING_KEY
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
