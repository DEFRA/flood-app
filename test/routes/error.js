'use strict'
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const errorPages = require('../../server/plugins/error-pages')
const boom = require('@hapi/boom')

describe('Route - Error', () => {
  let sandbox
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]

    sandbox = await sinon.createSandbox()

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  it('should 400 when visiting the page', async () => {
    const getError = () => {
      return boom.badRequest('test error')
    }

    const floodService = require('../../server/services/flood')

    sandbox.stub(floodService, 'getError').callsFake(getError)

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

    expect(response.statusCode).to.equal(400)
    expect(response.payload).to.contain('Sorry, there is a problem with the service')
  })
})
