const hapi = require('@hapi/hapi')
const config = require('../server/config')

describe('404 - [server/404.js]', () => {
  let server

  beforeAll(async () => {
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
        register: (server) => {
          server.route(require('../server/routes/national'))
        }
      }
    }
    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../server/plugins/views'))
    await server.register(require('../server/plugins/logging'))
    await server.register(routerPlugin)
    await server.register(require('../server/plugins/error-pages'))
    await server.register(require('../server/plugins/on-post-handler'))
    await server.initialize()
  })

  // Stop server after the tests.
  afterAll(async () => {
    await server.stop()
  })

  it('should return 404 when visiting a missing resource', async () => {
    const options = {
      method: 'GET',
      url: '/missing/resource'
    }

    const response = await server.inject(options)
    expect(response.statusCode).toBe(404)
    expect(response.headers['content-type']).toContain('text/html')
  })
})
