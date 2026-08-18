const hapi = require('@hapi/hapi')
const CatboxRedis = require('@hapi/catbox-redis')
const config = require('./config')
const registerServerMethods = require('./services/server-methods')
const { THIRTY_DAYS_MS, FOUR_HUNDRED_DAYS_MS } = require('./constants')
let cache

if (!config.localCache) {
  cache = [{
    name: 'redis_cache',
    provider: {
      constructor: CatboxRedis.Engine,
      options: {
        host: config.redisHost,
        port: config.redisPort,
        password: config.redisPassword,
        tls: { checkServerIdentity: () => undefined } // disable the default server side certificate check
      }
    }
  }]
}

async function createServer () {
  // Create the hapi server
  const server = hapi.server({
    port: config.port,
    routes: {
      validate: {
        options: {
          abortEarly: false,
          stripUnknown: true
        }
      },
      cors: true,
      security: true
    },
    cache
  })

  // Register the plugins
  await server.register(require('@hapi/inert'))
  await server.register(require('@hapi/h2o2'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/cookies'))
  await server.register(require('./plugins/on-post-handler'))
  await server.register(require('./plugins/session'))
  await server.register(require('./plugins/logging'))
  if (config.rateLimitEnabled) {
    await server.register(require('./plugins/rate-limit'))
  }

  const consentCookieOptions = {
    isSecure: config.siteUrl.startsWith('https'),
    isHttpOnly: false,
    path: '/',
    isSameSite: 'Lax',
    clearInvalid: true,
    strictHeader: false
  }

  server.state('set_cookie_usage', {
    ...consentCookieOptions,
    ttl: THIRTY_DAYS_MS,
    encoding: 'none'
  })

  server.state('cookie_policy', {
    ...consentCookieOptions,
    ttl: THIRTY_DAYS_MS,
    encoding: 'base64json'
  })

  server.state('seen_cookie_message', {
    ...consentCookieOptions,
    ttl: FOUR_HUNDRED_DAYS_MS,
    encoding: 'none'
  })

  server.state('google-analytics-opt-out', {
    ...consentCookieOptions,
    ttl: THIRTY_DAYS_MS,
    encoding: 'none'
  })

  // Registered so they can be read and cleared server side when consent is withdrawn
  server.state('_ga', { path: '/', encoding: 'none' })
  server.state('_gid', { path: '/', encoding: 'none' })
  server.state('_gat', { path: '/', encoding: 'none' })

  if (config.env !== 'production') {
    // Dev-only mock GA4 cookie set by dev-gtm.js
    server.state('_ga_XXXXXXXXXX', { path: '/', encoding: 'none' })
  }

  registerServerMethods(server)

  return server
}

module.exports = createServer
