'use strict'
const webpackConfig = require('../webpack.config')

describe('Webpack - [server/webpack-config.js]', () => {
  process.env.FLOOD_APP_GTM_ID = 'TEST_GTM_ID'
  process.env.NODE_ENV = 'dev'

  const webPack = webpackConfig()

  beforeEach(async () => {
    jest.replaceProperty(webPack, 'entry', {})
    jest.replaceProperty(webPack, 'module', {})
  })

  it('should not define analytics IDs at build time', async () => {
    expect(webPack.plugins).toBeNil()
  })
})
