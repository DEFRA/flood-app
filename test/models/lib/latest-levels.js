const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const getThresholdsForTargetArea = require('../../../server/models/views/lib/latest-levels')
const moment = require('moment-timezone')

const { expect } = Code
const lab = exports.lab = Lab.script()

lab.experiment('getThresholdsForTargetArea', () => {
  let clock
  let formatElapsedTimeStub

  lab.beforeEach(() => {
    const fixedTime = moment.tz('2024-08-12T12:45:00.000Z', 'Europe/London')
    clock = sinon.useFakeTimers(fixedTime.valueOf())

    formatElapsedTimeStub = sinon.stub(require('../../../server/util'), 'formatElapsedTime').callsFake((datetime) => {
      if (!datetime) return undefined

      const now = moment.tz('Europe/London')
      const diffMinutes = now.diff(moment.tz(datetime, 'Europe/London'), 'minutes')

      if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`
      } else {
        return 'More than 1 hour ago'
      }
    })
  })

  lab.afterEach(() => {
    clock.restore()
    formatElapsedTimeStub.restore()
  })

  lab.test('should return the prioritised thresholds with formatted timestamps', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW ACTCON FW', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(2)
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
    expect(result[1].formatted_time).to.equal('More than 1 hour ago')
  })

  lab.test('should exclude thresholds not matching the priority types', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW NONRES FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW ACT FW', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(1)
    expect(result[0].threshold_type).to.equal('FW ACT FW')
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
  })

  lab.test('should exclude thresholds with status Closed', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', status: 'Closed', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW RES FW', status: 'Active', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(1)
    expect(result[0].status).to.equal('Active')
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
  })

  lab.test('should exclude Welsh stations with no data', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', status: 'Active', iswales: true, latest_level: null, value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW RES FW', status: 'Active', iswales: false, latest_level: '0.5', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(1)
    expect(result[0].rloi_id).to.equal(2)
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
  })

  lab.test('should prioritize and return the correct threshold when there are duplicates with different types', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW ACT FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(1)
    expect(result[0].threshold_type).to.equal('FW RES FW')
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
  })

  lab.test('should return an empty array if no thresholds are provided', () => {
    const thresholds = []

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(0)
  })

  lab.test('should prioritize the first type in the WARNING_THRESHOLD_TYPES array when all thresholds are of the same type', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T12:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(2)
    expect(result[0].threshold_type).to.equal('FW RES FW')
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
    expect(result[1].formatted_time).to.equal('0 minutes ago')
  })

  lab.test('should correctly handle multiple thresholds with the same RLOI ID and type', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T12:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(1)
    expect(result[0].threshold_type).to.equal('FW RES FW')
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
  })

  lab.test('should ignore invalid thresholds and process only valid ones', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'INVALID TYPE', value_timestamp: '2024-08-12T12:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).to.have.length(1)
    expect(result[0].threshold_type).to.equal('FW RES FW')
    expect(result[0].formatted_time).to.equal('More than 1 hour ago')
  })
})