'use strict'
const Hapi = require('@hapi/hapi')
const errorPages = require('../../server/plugins/error-pages')
const boom = require('@hapi/boom')

describe('Route - Error', () => {
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
  })

  it('should 400 when visiting the page', async () => {
    const getError = () => {
      return boom.badRequest('test error')
    }

    const floodService = require('../../server/services/flood')

    jest.spyOn(floodService, 'getError').mockImplementation(getError)

    const route = {
      plugin: {
        name: 'error',
        register: (server) => {
          server.route(require('../../server/routes/error'))
        }
      }
    }

    await server.register(route)
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(errorPages)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/error'
    }

    const response = await server.inject(options)

    expect(response.statusCode).toBe(400)
    expect(response.payload).toContain('Sorry, there is a problem with the service')
  })
})
