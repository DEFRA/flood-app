'use strict'

const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')

lab.experiment('router logging test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/logging'))
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('Plugin logging successfully loads', async () => {
  })
})
