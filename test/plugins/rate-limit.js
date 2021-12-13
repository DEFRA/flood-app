'use strict'

const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const config = require('../../server/config')

lab.experiment('rate-limit plugin test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
    sandbox.stub(config, 'localCache').value('true')
    await server.register(require('../../server/plugins/rate-limit'))
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.res
  })

  lab.test('Plugin rate-limit successfully loads', async () => {
  })
})
