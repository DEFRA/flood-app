const hapi = require('@hapi/hapi')
const CatboxRedis = require('@hapi/catbox-redis')
const config = require('./config')
const registerServerMethods = require('./services/server-methods')
const { registerPlugins, registerCookieStates, registerLifecycleHooks } = require('./lib/server-helpers')
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
  await registerPlugins(server)

  // Register cookie states
  const consentCookieOptions = {
    isSecure: config.siteUrl.startsWith('https'),
    isHttpOnly: false,
    path: '/',
    isSameSite: 'Lax',
    clearInvalid: true,
    strictHeader: false
  }
  registerCookieStates(server, consentCookieOptions)

  // Register server methods and lifecycle hooks
  registerServerMethods(server)
  registerLifecycleHooks(server)

  return server
}

module.exports = createServer
