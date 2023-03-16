const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const processImtdThresholds = require('../../../server/models/views/lib/process-imtd-thresholds')

const alertExpectedText = { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts' }
const warningExpectedText = { id: 'warningThreshold', description: 'Property flooding is possible above this level. One or more flood warnings may be issued', shortname: 'Possible flood warnings' }

lab.experiment('process IMTD thresholds test', () => {
  lab.experiment('given post processing is set to false', () => {
    lab.test('then thresholds should be returned as is', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 0, 0, false)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '1.10' }, { ...warningExpectedText, value: '2.10' }])
    })
    lab.test('then single null thresholds should not be returned', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: null }, 0, 0, false)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '1.10' }])
    })
    lab.test('then both null thresholds should not be returned', async () => {
      const threshold = processImtdThresholds({ alert: null, warning: null }, 0, 0, false)
      Code.expect(threshold).to.equal([])
    })
    lab.test('then empty thresholds should not cause error', async () => {
      const threshold = processImtdThresholds({}, 0, 0, false)
      Code.expect(threshold).to.equal([])
    })
  })
  lab.experiment('given post processing is set to true', () => {
    lab.test('then thresholds should be returned as is when stageDatum is zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 0, 0, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '1.10' }, { ...warningExpectedText, value: '2.10' }])
    })
    lab.test('then thresholds should be returned as adjusted when stageDatum is greater than zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 2.2, 0, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '-1.10' }, { ...warningExpectedText, value: '-0.10' }])
    })
    lab.test('then thresholds should be returned as is when stageDatum is less than zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, -2.2, 0, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '1.10' }, { ...warningExpectedText, value: '2.10' }])
    })
    lab.test('then thresholds should be returned as adjusted when stageDatum is less than zero and stationSubtract is greater than zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, -2.2, 0.5, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '0.60' }, { ...warningExpectedText, value: '1.60' }])
    })
    lab.test('then thresholds should be returned as is when stageDatum is less than zero and stationSubtract is less than zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, -2.2, -0.5, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '1.10' }, { ...warningExpectedText, value: '2.10' }])
    })
    lab.test('then thresholds should be returned as is when stageDatum is equal to zero and stationSubtract is less than zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 0, -0.5, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '1.10' }, { ...warningExpectedText, value: '2.10' }])
    })
    lab.test('then thresholds should be returned as adjusted when stageDatum is equal to zero and stationSubtract is greater than than zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 0, 0.5, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '0.60' }, { ...warningExpectedText, value: '1.60' }])
    })
    lab.test('then thresholds should be returned as is when stageDatum is equal to zero and stationSubtract is zero', async () => {
      const threshold = processImtdThresholds({ alert: 1.1, warning: 2.1 }, 0, 0, true)
      Code.expect(threshold).to.equal([{ ...alertExpectedText, value: '1.10' }, { ...warningExpectedText, value: '2.10' }])
    })
  })
})
