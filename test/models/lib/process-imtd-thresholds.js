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
  lab.test('thresholds should be returned as adjusted when post processing is true and stageDatum is greater than zero', async () => {
    const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 2.2, 0, true)
    Code.expect(threshold).to.equal([
      { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts', value: '-1.10' },
      { id: 'warningThreshold', description: 'Property flooding is possible above this level. One or more flood warnings may be issued', shortname: 'Possible flood warnings', value: '-0.10' }
    ])
  })
  lab.test('thresholds should be returned as is when post processing is true and stageDatum is less than zero', async () => {
    const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, -2.2, 0, true)
    Code.expect(threshold).to.equal([
      { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts', value: '1.10' },
      { id: 'warningThreshold', description: 'Property flooding is possible above this level. One or more flood warnings may be issued', shortname: 'Possible flood warnings', value: '2.10' }
    ])
  })
  lab.test('thresholds should be returned as adjusted when post processing is true, stageDatum is less than zero and stationSubtract is greater than zero', async () => {
    const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, -2.2, 0.5, true)
    Code.expect(threshold).to.equal([
      { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts', value: '0.60' },
      { id: 'warningThreshold', description: 'Property flooding is possible above this level. One or more flood warnings may be issued', shortname: 'Possible flood warnings', value: '1.60' }
    ])
  })
  lab.test('single null thresholds should not be returned', async () => {
    const threshold = processImtdThresholds({ alert: 1.1, warning: null }, 0, 0, false)
    Code.expect(threshold).to.equal([
      { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts', value: '1.10' }
    ])
  })
  lab.test('both null thresholds should not be returned', async () => {
    const threshold = processImtdThresholds({ alert: null, warning: null }, 0, 0, false)
    Code.expect(threshold).to.equal([])
  })
  lab.test('empty thresholds should not cause error', async () => {
    const threshold = processImtdThresholds({}, 0, 0, false)
    Code.expect(threshold).to.equal([])
  })
})
