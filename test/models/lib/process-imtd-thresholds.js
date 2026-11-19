const data = require('../../data')
const processImtdThresholds = require('../../../server/models/views/lib/process-imtd-thresholds')

const alertExpectedText = { id: 'alertThreshold', description: 'Low-lying land flooding possible above this level. One or more flood alerts may be issued.', shortname: 'Possible flood alerts' }
const warningExpectedText = { id: 'warningThreshold', description: 'Property flooding is possible above this level', shortname: 'Possible flood warnings' }

function expectThresholds (thresholds, warningThreshold, alertThreshold) {
  expect(thresholds.length).toBe(2)
  expect(thresholds[0]).toEqual({ ...warningExpectedText, value: warningThreshold })
  expect(thresholds[1]).toEqual({ ...alertExpectedText, value: alertThreshold })
}

describe('Model/Lib - Process IMTD Thresholds', () => {
  describe('post processing is set to "false"', () => {
    it('should return thresholds as is', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0, false)

      expectThresholds(thresholds, '2.10', '1.10')
    })

    it('should not be return single null thresholds', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: null }, 0, 0, false)

      expect(thresholds.length).toBe(1)
      expect(thresholds[0]).toEqual({ ...alertExpectedText, value: '1.10' })
    })

    it('then both null thresholds should not return double null thresholds', async () => {
      const thresholds = processImtdThresholds({ alert: null, warning: null }, 0, 0, false)

      expect(thresholds).toEqual([])
    })

    it('should not cause an error when thresholds are empty', async () => {
      const thresholds = processImtdThresholds({}, 0, 0, false)

      expect(thresholds).toEqual([])
    })
  })

  describe('post processing is set to "true"', () => {
    it('should return thresholds as is when "stageDatum" is zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0, true)

      expectThresholds(thresholds, '2.10', '1.10')
    })

    it('should return thresholds as adjusted when "stageDatum" is greater than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 2.2, 0, true)

      expectThresholds(thresholds, '-0.10', '-1.10')
    })

    it('should return thresholds as is when "stageDatum" is less than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, -2.2, 0, true)

      expectThresholds(thresholds, '2.10', '1.10')
    })

    it('should return thresholds as adjusted when "stageDatum" is less than zero and "stationSubtract" is greater than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, -2.2, 0.5, true)

      expectThresholds(thresholds, '1.60', '0.60')
    })

    it('should return thresholds as is when "stageDatum" is less than zero and "stationSubtract" is less than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, -2.2, -0.5, true)

      expectThresholds(thresholds, '2.10', '1.10')
    })

    it('should return thresholds as is when "stageDatum" is equal to zero and "stationSubtract" is less than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, -0.5, true)

      expectThresholds(thresholds, '2.10', '1.10')
    })

    it('should return thresholds as adjusted when "stageDatum" is equal to zero and "stationSubtract" is greater than than zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0.5, true)

      expectThresholds(thresholds, '1.60', '0.60')
    })

    it('should return thresholds as is when "stageDatum" is equal to zero and "stationSubtract" is zero', async () => {
      const thresholds = processImtdThresholds({ alert: 1.1, warning: data.warning }, 0, 0, true)

      expectThresholds(thresholds, '2.10', '1.10')
    })
  })
})
