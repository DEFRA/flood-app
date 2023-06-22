'use strict'
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const webpackConfig = require('../webpack.config')

lab.experiment('webpack config test', () => {
  let sandbox
  // let server
  process.env.FLOOD_APP_GA4_ID = 'TEST_GA4_ID'
  process.env.FLOOD_APP_GTM_ID = 'TEST_GTM_ID'
  process.env.NODE_ENV = 'dev'
  const webPack = webpackConfig()
  lab.beforeEach(async () => {
    sandbox = sinon.createSandbox()
    sandbox.stub(webPack, 'entry').value({})
    sandbox.stub(webPack, 'module').value({})
  })

  lab.afterEach(async () => {
    await sandbox.restore()
  })

  lab.test('webpack config', async () => {
    Code.expect(webPack.plugins[0].definitions).to.be.a.object()
    Code.expect(webPack.plugins[0].definitions['process.env.GA4_ID']).to.equal('"TEST_GA4_ID"')
    Code.expect(webPack.plugins[0].definitions['process.env.GTM_ID']).to.equal('"TEST_GTM_ID"')
  })
})
