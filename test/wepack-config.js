'use strict'
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const sinon = require('sinon')
const webpackConfig = require('../webpack.config')

describe('Webpack - [server/webpack-config.js]', () => {
  let sandbox

  process.env.FLOOD_APP_GA4_ID = 'TEST_GA4_ID'
  process.env.FLOOD_APP_GTM_ID = 'TEST_GTM_ID'
  process.env.NODE_ENV = 'dev'

  const webPack = webpackConfig()

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    sandbox.stub(webPack, 'entry').value({})
    sandbox.stub(webPack, 'module').value({})
  })

  afterEach(async () => {
    await sandbox.restore()
  })

  it('should set plugin definitions', async () => {
    expect(webPack.plugins[0].definitions).to.be.a.object()
    expect(webPack.plugins[0].definitions['process.env.GA4_ID']).to.equal('"TEST_GA4_ID"')
    expect(webPack.plugins[0].definitions['process.env.GTM_ID']).to.equal('"TEST_GTM_ID"')
  })
})
