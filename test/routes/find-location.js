'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - find-location', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })

    const findLocationPlugin = {
      plugin: {
        name: 'find-location',
        register: (server, options) => {
          server.route(require('../../server/routes/find-location'))
        }
      }
    }

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(findLocationPlugin)
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
    const regex = /.\/server\/models\/./
    Object.keys(require.cache).forEach((key) => {
      if (key.match(regex)) {
        delete require.cache[key]
      }
    })
  })
  lab.test('GET /find-location should redirect to the root (ie aka national) page', async () => {
    const options = {
      method: 'GET',
      url: '/find-location'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(301)
    Code.expect(response.headers.location).to.equal('/')
  })
})
