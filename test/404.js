
const hapi = require('@hapi/hapi')
const config = require('../server/config')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
// const createServer = require('../server')

lab.experiment('Missing resource test', () => {
  let server

  lab.before(async () => {
    server = await hapi.server({
      port: config.port,
      routes: {
        validate: {
          options: {
            abortEarly: false
          }
        }
      }
    })

    const routerPlugin = {
      plugin: {
        name: 'router',
        register: (server, options) => {
          server.route(require('../server/routes/find-location'))
        }
      }
    }
    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../server/plugins/views'))
    await server.register(routerPlugin)
    await server.register(require('../server/plugins/error-pages'))
    await server.register(require('../server/plugins/on-post-handler'))
    await server.initialize()
  })

  // Stop server after the tests.
  lab.after(async () => {
    await server.stop()
  })

  lab.test('Missing resources are handled correctly', async () => {
    const options = {
      method: 'GET',
      url: '/missing/resource'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(404)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
})
