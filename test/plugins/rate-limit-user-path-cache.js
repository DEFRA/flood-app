'use strict'

const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const sinon = require('sinon')
const config = require('../../server/config')

lab.experiment('rate-limit no local cache', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    sandbox.stub(config, 'localCache').value(false)
    sandbox.stub(config, 'rateLimitEnabled').value(true)
    sandbox.stub(config, 'rateLimitExpiresIn').value(1)
    sandbox.stub(config, 'rateLimitRequests').value(1)
    sandbox.stub(config, 'rateLimitWhitelist').value(['1.1.1.1', '2.2.2.2'])
  })

  lab.afterEach(async () => {
    delete require.cache[require.resolve('../../server/plugins/rate-limit.js')]
    await sandbox.res
  })

  lab.test('test setting userPathCache', () => {
    const rateLimit = require('../../server/plugins/rate-limit.js')
    Code.expect(rateLimit.options.userCache.cache).to.equal('redis_cache')
  })
})
