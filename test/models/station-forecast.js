'use strict'

const moment = require('moment-timezone')
const ViewModel = require('../../server/models/views/station-forecast')
const data = require('../data')

describe('Model - Station Forecast', () => {
  it('should return FFOI station 7377 and set "maxValue._', async () => {
    const stationData = data.forcastStationModelData

    stationData.values.$.date = moment().subtract(1, 'day').format('YYYY-MM-DD')
    stationData.values.$.time = moment().subtract(2, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].$.startDate = moment().subtract(4, 'days').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].$.startTime = moment().subtract(2, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].$.endDate = moment().add(6, 'days').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].$.endTime = moment().subtract(2, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].Value[0].$.date = moment().add(2, 'days').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].Value[0].$.time = moment().format('HH:mm:ss')

    stationData.values.SetofValues[0].Value[1].$.date = moment().format('YYYY-MM-DD')
    stationData.values.SetofValues[0].Value[1].$.time = moment().add(1, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].Value[2].$.date = moment().add(22, 'hours').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].Value[2].$.time = moment().subtract(2, 'hours').format('HH:mm:ss')

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    expect(Result.hasForecastData).toBe(true)
    expect(Result.maxValue._).toBe('0.202')
  })
})

describe('Model - Station Forecast (branches)', () => {
  const now = '2024-06-10T12:00:00Z'

  const buildData = (values, overrides = {}) => ({
    values: {
      forecast_date: now,
      start_timestamp: now,
      end_timestamp: '2024-06-20T12:00:00Z',
      parameter: 'Water Level',
      qualifier: 'Stage',
      units: 'm',
      SetofValues: [{
        Value: values.map(([date, time, value]) => ({ $: { date, time }, _: value }))
      }],
      ...overrides
    }
  })

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(now) })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should have no forecast data when there are no values', () => {
    const viewModel = new ViewModel({})

    expect(viewModel.hasForecastData).toBeFalse()
    expect(viewModel.hasWarnings).toBeFalse()
    expect(viewModel.warningMessage).toBe('')
    expect(JSON.parse(viewModel.forecastJSON)).toEqual({ hasForecast: false })
  })

  it('should have no forecast data when SetofValues is empty', () => {
    const viewModel = new ViewModel(buildData([], { SetofValues: [] }))

    expect(viewModel.hasForecastData).toBeFalse()
    expect(viewModel.values).toBeUndefined()
  })

  it('should keep river values within 36 hours and pick the highest as maxValue', () => {
    const viewModel = new ViewModel(buildData([
      ['2024-06-10', '13:00:00', '0.500'],
      ['2024-06-11', '06:00:00', '0.900'],
      ['2024-06-11', '18:00:00', '0.700'],
      ['2024-06-12', '06:00:00', '1.500']
    ]))

    expect(viewModel.hasForecastData).toBeTrue()
    expect(viewModel.processedValues).toHaveLength(3)
    expect(viewModel.maxValue._).toBe('0.900')
    expect(viewModel.parameter).toBe('Water Level')
    expect(viewModel.units).toBe('m')
    expect(JSON.parse(viewModel.forecastJSON)).toMatchObject({ hasForecast: true, maxValue: { _: '0.900' } })
  })

  it('should keep coastal values up to 5 days ahead', () => {
    const values = [
      ['2024-06-10', '13:00:00', '0.500'],
      ['2024-06-13', '12:00:00', '1.500'],
      ['2024-06-16', '12:00:00', '2.500']
    ]

    const viewModel = new ViewModel(buildData(values), true)

    expect(viewModel.processedValues).toHaveLength(2)
    expect(viewModel.maxValue._).toBe('1.500')
  })

  it('should start the forecast from the latest observed reading when provided', () => {
    const latestObserved = { ts: '2024-06-10T15:00:00Z' }

    const viewModel = new ViewModel(buildData([
      ['2024-06-10', '13:00:00', '2.000'],
      ['2024-06-10', '16:00:00', '0.400']
    ]), false, latestObserved)

    expect(viewModel.forecastStart.toISOString()).toBe('2024-06-10T15:00:00.000Z')
    expect(viewModel.processedValues).toHaveLength(1)
    expect(viewModel.maxValue._).toBe('0.400')
  })

  it('should flag no forecast data when all values fall outside the forecast window', () => {
    const viewModel = new ViewModel(buildData([
      ['2024-06-09', '12:00:00', '0.500'],
      ['2024-06-15', '12:00:00', '0.600']
    ]))

    expect(viewModel.hasForecastData).toBeFalse()
    expect(viewModel.processedValues).toBeEmpty()
    expect(viewModel.maxValue).toBeUndefined()
  })

  it('should format timestamps as today, tomorrow or a date', () => {
    const viewModel = new ViewModel(buildData([
      ['2024-06-10', '13:00:00', '0.500'],
      ['2024-06-11', '06:00:00', '0.600'],
      ['2024-06-12', '06:00:00', '0.700']
    ]))

    const [today, tomorrow, later] = viewModel.values.map(value => value.formattedTimestamp)

    expect(today).toBe('2:00pm today')
    expect(tomorrow).toBe('7:00am tomorrow')
    expect(later).toBe('7:00am on 12/06/24')
  })
})
