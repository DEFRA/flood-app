const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')

lab.experiment('Ensure config is correct', () => {
  lab.test('test valid config', () => {
    Code.expect(() => {
      require('../server/config')
    }).not.to.throw()
  })
})
