const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const processImtdThresholds = require('../../../server/models/views/lib/process-imtd-thresholds')

lab.experiment('process IMTD thresholds test', () => {
  lab.test('thresholds should be returned as is when post processing is false', async () => {
    const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 0, 0, false)
    Code.expect(threshold).to.equal([
      { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts', value: '1.10' },
      { id: 'warningThreshold', description: 'Property flooding is possible above this level. One or more flood warnings may be issued', shortname: 'Possible flood warnings', value: '2.10' }
    ])
  })
  lab.test('thresholds should be returned as is when post processing is true and stageDatum is zero', async () => {
    const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 0, 0, true)
    Code.expect(threshold).to.equal([
      { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts', value: '1.10' },
      { id: 'warningThreshold', description: 'Property flooding is possible above this level. One or more flood warnings may be issued', shortname: 'Possible flood warnings', value: '2.10' }
    ])
  })
  lab.test('thresholds should be returned as adjusted when post processing is true and stageDatum is not zero', async () => {
    const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 2.2, 0, true)
    Code.expect(threshold).to.equal([
      { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts', value: '-1.10' },
      { id: 'warningThreshold', description: 'Property flooding is possible above this level. One or more flood warnings may be issued', shortname: 'Possible flood warnings', value: '-0.10' }
    ])
  })
})
