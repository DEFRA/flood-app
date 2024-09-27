const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const data = require('../../data')
const lab = exports.lab = Lab.script()
const processImtdThresholds = require('../../../server/models/views/lib/process-imtd-thresholds')

const alertExpectedText = { id: 'alertThreshold', description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued', shortname: 'Possible flood alerts' }
const warningExpectedText = { id: 'warningThreshold', description: 'Flood Warning issued: <a href="/target-area/062FWF46Harpendn">River Lee at Harpenden</a>', shortname: 'Possible flood warnings' }

function expectThresholds (thresholds, warningThreshold, alertThreshold) {
  Code.expect(thresholds.length).to.equal(2)
  Code.expect(thresholds[0]).to.equal({ ...warningExpectedText, value: warningThreshold })
  Code.expect(thresholds[1]).to.equal({ ...alertExpectedText, value: alertThreshold })
}

lab.experiment('process IMTD thresholds test', () => {
  lab.experiment('given post processing is set to false', () => {
    lab.test('then thresholds should be returned as is', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0, false)
      expectThresholds(thresholds, '2.10', '1.10')
    })
    lab.test('then single null thresholds should not be returned', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: null }, 0, 0, false)
      Code.expect(thresholds.length).to.equal(1)
      Code.expect(thresholds[0]).to.equal({ ...alertExpectedText, value: '1.10' })
    })
    lab.test('then both null thresholds should not be returned', async () => {
      const thresholds = processImtdThresholds({ alert: null, warning: null }, 0, 0, false)
      Code.expect(thresholds).to.equal([])
    })
    lab.test('then empty thresholds should not cause error', async () => {
      const thresholds = processImtdThresholds({}, 0, 0, false)
      Code.expect(thresholds).to.equal([])
    })
  })
  lab.experiment('given post processing is set to true', () => {
    lab.test('then thresholds should be returned as is when stageDatum is zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0, true)
      expectThresholds(thresholds, '2.10', '1.10')
    })
    lab.test('then thresholds should be returned as adjusted when stageDatum is greater than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 2.2, 0, true)
      expectThresholds(thresholds, '-0.10', '-1.10')
    })
    lab.test('then thresholds should be returned as is when stageDatum is less than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, -2.2, 0, true)
      expectThresholds(thresholds, '2.10', '1.10')
    })
    lab.test('then thresholds should be returned as adjusted when stageDatum is less than zero and stationSubtract is greater than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, -2.2, 0.5, true)
      expectThresholds(thresholds, '1.60', '0.60')
    })
    lab.test('then thresholds should be returned as is when stageDatum is less than zero and stationSubtract is less than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, -2.2, -0.5, true)
      expectThresholds(thresholds, '2.10', '1.10')
    })
    lab.test('then thresholds should be returned as is when stageDatum is equal to zero and stationSubtract is less than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, -0.5, true)
      expectThresholds(thresholds, '2.10', '1.10')
    })
    lab.test('then thresholds should be returned as adjusted when stageDatum is equal to zero and stationSubtract is greater than than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0.5, true)
      expectThresholds(thresholds, '1.60', '0.60')
    })
    lab.test('then thresholds should be returned as is when stageDatum is equal to zero and stationSubtract is zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0, true)
      expectThresholds(thresholds, '2.10', '1.10')
    })
  })
})
