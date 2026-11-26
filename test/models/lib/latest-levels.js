const getThresholdsForTargetArea = require('../../../server/models/views/lib/latest-levels')
const moment = require('moment-timezone')

describe('Model/Lib - Latest Level', () => {
  beforeEach(() => {
    const fixedTime = moment.tz('2024-08-12T12:45:00.000Z', 'Europe/London')
    jest.useFakeTimers()
    jest.setSystemTime(fixedTime.toDate())

    const util = require('../../../server/util')
    jest.spyOn(util, 'formatElapsedTime').mockImplementation((datetime) => {
      if (!datetime) return undefined

      const now = moment.tz('Europe/London')
      const diffMinutes = now.diff(moment.tz(datetime, 'Europe/London'), 'minutes')

      if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`
      }

      return 'More than 1 hour ago'
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('should return the prioritised thresholds with formatted timestamps', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW ACTCON FW', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(2)
    expect(result[0].formatted_time).toBe('More than 1 hour ago')
    expect(result[1].formatted_time).toBe('More than 1 hour ago')
  })

  it('should exclude thresholds not matching the priority types', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW NONRES FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW ACT FW', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(1)
    expect(result[0].threshold_type).toBe('FW ACT FW')
    expect(result[0].formatted_time).toBe('More than 1 hour ago')
  })

  it('should exclude thresholds with status "Closed"', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', status: 'Closed', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW RES FW', status: 'Active', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('Active')
    expect(result[0].formatted_time).toBe('More than 1 hour ago')
  })

  it('should exclude welsh stations with no data', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW RES FW', status: 'Active', iswales: true, latest_level: null, value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 2, threshold_type: 'FW RES FW', status: 'Active', iswales: false, latest_level: '0.5', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(1)
    expect(result[0].rloi_id).toBe(2)
    expect(result[0].formatted_time).toBe('More than 1 hour ago')
  })

  it('should prioritize and return the correct threshold when there are duplicates with different types', () => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW ACT FW', value_timestamp: '2024-08-12T11:45:00.000Z' },
      { rloi_id: 1, threshold_type: 'FW RES FW', value_timestamp: '2024-08-12T10:45:00.000Z' }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(1)
    expect(result[0].threshold_type).toBe('FW RES FW')
    expect(result[0].formatted_time).toBe('More than 1 hour ago')
  })

  it('should return an empty array if no thresholds are provided', () => {
    const thresholds = []

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(0)
  })

  it('should adjust "threshold_value" using "stageDatum" if "postProcess" is true and "stageDatum" > 0', () => {
    const thresholds = [
      {
        rloi_id: 1,
        threshold_type: 'FW RES FW',
        value_timestamp: '2024-08-12T11:45:00.000Z',
        threshold_value: '5.00',
        stage_datum: 2.5,
        subtract: 1.0,
        post_process: true
      }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(1)
    expect(result[0].threshold_value).toBe('2.50')
  })

  it('should adjust "threshold_value" using subtract if "postProcess" is true, "stageDatum" <= 0, and "subtract" > 0', () => {
    const thresholds = [
      {
        rloi_id: 2,
        threshold_type: 'FW ACT FW',
        value_timestamp: '2024-08-12T10:45:00.000Z',
        threshold_value: '5.00',
        stage_datum: 0,
        subtract: 1.5,
        post_process: true
      }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(1)
    expect(result[0].threshold_value).toBe('3.50')
  })

  it('should not adjust "threshold_value" if "postProcess" is false', () => {
    const thresholds = [
      {
        rloi_id: 3,
        threshold_type: 'FW ACTCON FW',
        value_timestamp: '2024-08-12T11:45:00.000Z',
        threshold_value: '4.00',
        stage_datum: 1.0,
        subtract: 1.5,
        post_process: false
      }
    ]

    const result = getThresholdsForTargetArea(thresholds)

    expect(result).toHaveLength(1)
    expect(result[0].threshold_value).toBe('4.00')
  })

  it.each([
    ['C', 'Sea Levels', 'Sea'],
    ['C', 'River Eden', 'River Eden'],
    ['G', 'River Eden', 'Groundwater'],
    ['S', 'Sea Levels', 'Sea Levels']
  ])('should set river_name for station type %s on %s to %s', (stationType, riverName, expected) => {
    const thresholds = [
      { rloi_id: 1, threshold_type: 'FW ACT FW', station_type: stationType, river_name: riverName, value_timestamp: '2024-08-12T11:45:00.000Z' }
    ]

    const [result] = getThresholdsForTargetArea(thresholds)

    expect(result.river_name).toBe(expected)
  })
})
