const hapi = require('hapi')
const config = require('./config')

async function createServer () {
  // Create the hapi server
  const server = hapi.server({
    port: config.port,
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      }
    }
  })

  // Register the plugins
  await server.register(require('inert'))
  await server.register(require('h2o2'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/builder'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/full-url'))
  await server.register(require('./plugins/session'))

  if (config.isDev) {
    await server.register(require('blipp'))
    await server.register(require('./plugins/logging'))
  }

  if (config.errbit.postErrors) {
    await server.register({
      plugin: require('node-hapi-airbrake'),
      options: config.errbit.options
    })
  }

  return server
}

module.exports = createServer
