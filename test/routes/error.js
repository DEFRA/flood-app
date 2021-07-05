'use strict'
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Error route test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]

    sandbox = await sinon.createSandbox()

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('GET /error', async () => {
    const getError = () => {
      return JSON.parse('{"statusCode":400,"error":"Bad Request","message":"Test Error"}')
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
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/error'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(500)
  })
})
