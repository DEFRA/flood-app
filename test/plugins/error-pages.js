'use strict'

const Hapi = require('@hapi/hapi')
const boom = require('@hapi/boom')

describe('Plugin - Error Pages', () => {
  let server
  let logSpies
  let fakeResponse

  beforeEach(async () => {
    logSpies = {
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    }

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(require('../../server/plugins/error-pages'))

    await server.register({
      plugin: {
        name: 'national',
        register: (server) => server.route({
          method: 'GET',
          path: '/some/root',
          handler: (request) => {
            request.logger = logSpies
            return fakeResponse
          }
        })
      }
    })

    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  it('should handle 404', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }

    fakeResponse = boom.notFound('something went wrong')

    const response = await server.inject(options)
    expect(logSpies.debug).toHaveBeenCalled()
    expect(response.statusCode).toBe(404)
    expect(response.payload).toContain('Page not found')
  })

  it('should move 400s with the message \'Invalid request params input\' to 404 pages', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }

    fakeResponse = boom.badRequest('Invalid request params input')

    const response = await server.inject(options)

    expect(logSpies.debug).toHaveBeenCalled()
    expect(response.statusCode).toBe(404)
    expect(response.payload).toContain('Page not found')
  })

  it('should handle rate limited requests', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }

    fakeResponse = boom.tooManyRequests(new Error('too many requests'))

    const response = await server.inject(options)

    expect(logSpies.warn).toHaveBeenCalled()
    expect(response.statusCode).toBe(429)
    expect(response.payload).toContain('Too many requests made for this page')
  })

  it('should handle 5xx errors', async () => {
    const options = {
      method: 'GET',
      url: '/some/root'
    }

    fakeResponse = boom.internal(new Error('something wrong'))

    const response = await server.inject(options)

    expect(logSpies.error).toHaveBeenCalled()
    expect(response.statusCode).toBe(500)
    expect(response.payload).toContain('Sorry, there is a problem with the service')
  })
})
