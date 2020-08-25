'use strict'

const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')

lab.experiment('error-pages plugin test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
    await server.register(require('../../server/plugins/error-pages'))
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.res
  })

  lab.test('Plugin error-pages successfully loads', async () => {
  })
})
