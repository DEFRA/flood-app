const hapi = require('@hapi/hapi')

const createServer = async () => {
  const server = hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
      validate: {
        options: {
          abortEarly: false,
          stripUnknown: true
        }
      }
    }
  })

  await server.register(require('@hapi/inert'))
  await server.register(require('@hapi/h2o2'))
  await server.register(require('../../server/plugins/views'))
  await server.register(require('../../server/plugins/logging'))

  require('../../server/services/server-methods')(server)

  server._addPlugins = async (files = []) => {
    const plugins = files.map(file => server.register(file))

    await Promise.all(plugins)
  }

  server._addRoutes = async (files = []) => {
    const routerPlugin = {
      plugin: {
        name: 'mock-router',
        register: (svr) => {
          files.forEach(file => svr.route(file))
        }
      }
    }

    await server.register(routerPlugin)
  }

  return server
}

module.exports = createServer
