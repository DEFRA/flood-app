const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const { formatName } = require('../../server/util')

lab.experiment('formatName', () => {
  lab.test('Repeating parts are removed', async () => {
    Code.expect(formatName('Durham, Durham')).to.equal('Durham')
  })
  lab.test('Similar parts are not removed', async () => {
    Code.expect(formatName('Durham, County Durham')).to.equal('Durham, County Durham')
  })
  lab.test('United Kingdom removed', async () => {
    Code.expect(formatName('Durham, United Kingdom')).to.equal('Durham')
  })
  lab.test('Address part removed', async () => {
    Code.expect(formatName('The Big House, Durham', 'The Big House')).to.equal('Durham')
  })
  lab.test('Duplicate but not repeating parts are not removed', async () => {
    // Note: not sure of an example which would occur in the real world example but included here for completeness
    Code.expect(formatName('Newcastle, Northumberland, Newcastle')).to.equal('Newcastle, Northumberland, Newcastle')
  })
  lab.test('Case mismatch is not considered duplicate', async () => {
    // Note: not expected to occur in the real world, see comments in formatName
    Code.expect(formatName('Durham, durham')).to.equal('Durham, durham')
  })
  lab.test('Fails gracefully with undefined name', async () => {
    Code.expect(formatName()).to.equal('')
  })
})
