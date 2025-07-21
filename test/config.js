const Lab = require('@hapi/lab')
const { describe, it } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')

describe('Config - [server/config.js]', () => {
  it('should load the config file', () => {
    expect(() => {
      require('../server/config')
    }).not.to.throw()
  })
})
