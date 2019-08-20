'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - home', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })

    const homePlugin = {
      plugin: {
        name: 'home',
        register: (server, options) => {
          server.route(require('../../server/routes/home'))
        }
      }
    }

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(homePlugin)
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('GET /', async () => {
    const options = {
      method: 'GET',
      url: '/'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
})
