'use strict'

const hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
// const createServer = require('../../server')
const config = require('../../server/config')

lab.experiment('Routes test - home', () => {
  let sandbox
  let server

  // Create cut down server before the tests.

  lab.before(async () => {
    // server = await createServer()
    // await server.initialize()

    // TODO refactor. Using this approach in order to easily stub out plugins (i.e. data-schedule)
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
          server.route(require('../../server/routes/home'))
        }
      }
    }
    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    // await server.register(require('../../server/plugins/router'))
    await server.register(routerPlugin)
    await server.register(require('../../server/plugins/builder'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register(require('../../server/plugins/full-url'))
    // await server.register(require('../../server/plugins/session'))
  })

  // Stop server after the tests.
  lab.after(async () => {
    await server.stop()
  })

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    sandbox = sinon.createSandbox()
  })

  lab.afterEach(async () => {
    sandbox.restore()
  })

  lab.test('1 - GET /', async () => {
    const options = {
      method: 'GET',
      url: '/'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
})
