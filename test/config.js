const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')

lab.experiment('Config - [server/config.js]', () => {
  lab.test('should load the config file', () => {
    Code.expect(() => {
      require('../server/config')
    }).not.to.throw()
  })
})
