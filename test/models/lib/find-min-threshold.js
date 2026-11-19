'use strict'

const filterImtdThresholds = require('../../../server/models/views/lib/find-min-threshold')

describe('Model/Lib - Find Min Threshold', () => {
  it('should return the lowest alert value and lowest warning threshold by priority', () => {
    const warningThreshold = { fwis_type: 'W', threshold_type: 'FW ACT FW', value: '2.1' }

    const result = filterImtdThresholds([
      { fwis_type: 'A', threshold_type: 'FW RES FAL', value: '1.5' },
      { fwis_type: 'A', threshold_type: 'FW RES FAL', value: '1.2' },
      { fwis_type: 'A', threshold_type: 'FW ACT FAL', value: '0.5' },
      warningThreshold,
      { fwis_type: 'W', threshold_type: 'FW ACT FW', value: '2.4' },
      { fwis_type: 'W', threshold_type: 'FW ACTCON FW', value: '1.0' }
    ])

    expect(result).toEqual({ alert: '1.2', warning: warningThreshold })
  })

  it('should fall back to the next threshold type when higher priority types are missing', () => {
    const warningThreshold = { fwis_type: 'W', threshold_type: 'FW ACTCON FW', value: '3.0' }

    const result = filterImtdThresholds([
      { fwis_type: 'A', threshold_type: 'FW ACTCON FAL', value: '0.9' },
      warningThreshold
    ])

    expect(result).toEqual({ alert: '0.9', warning: warningThreshold })
  })

  it('should return nulls when there are no matching thresholds', () => {
    expect(filterImtdThresholds([])).toEqual({ alert: null, warning: null })
  })
})
