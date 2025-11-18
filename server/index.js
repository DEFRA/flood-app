const hapi = require('@hapi/hapi')
const CatboxRedis = require('@hapi/catbox-redis')
const config = require('./config')
const registerServerMethods = require('./services/server-methods')
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
  await server.register(require('./plugins/on-post-handler'))
  await server.register(require('./plugins/session'))
  await server.register(require('./plugins/logging'))
  if (config.rateLimitEnabled) {
    await server.register(require('./plugins/rate-limit'))
  }

  registerServerMethods(server)

  if (process.env.NODE_ENV === 'development' || config.localCache) {
    server.methods.flood.getOutlook = async () => {
      return require('../server/models/5df.json')
    }
  }

  return server
}

module.exports = createServer
