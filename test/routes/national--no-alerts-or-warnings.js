'use strict'
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - national view', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util.js')]

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

  lab.test('GET /national view', async () => {
    // Create dummy flood data in place of cached data
    const fakeFloodData = () => {
      return {
        floods: []
      }
    }

    const floodService = require('../../server/services/flood')
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)

    // Fake the cached flood data
    floodService.floods = await floodService.getFloods()

    const locationPlugin = {
      plugin: {
        name: 'national',
        register: (server, options) => {
          server.route(require('../../server/routes/national'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(locationPlugin)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/national'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('There are currently no flood warnings or alerts in force.')
    Code.expect(response.payload).to.contain('If you live near a river or the coast you may be able to')
  })
})
