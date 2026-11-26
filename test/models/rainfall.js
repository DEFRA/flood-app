'use strict'

const ViewModel = require('../../server/models/views/rainfall')
const data = require('../data')
const moment = require('moment-timezone')

describe('Model - Rainfall', () => {
  it('should return single-word "stationName" in title case', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)
    const Result = viewModel

    expect(Result.stationName).toBe('Lavenham')
    expect(Result.telemetry.length).toBeGreaterThan(0)
    expect(Result.telemetryRainfall.latest1hr).toBe('3.21')
  })

  it('should return mutli-word "stationName" in title case', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'N24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.stationName).toBe('Newcastle Upon Tyne')
    expect(Result.telemetry.length).toBeGreaterThan(0)
    expect(Result.telemetryRainfall.latest1hr).toBe('5.02')
  })

  it('should return "telemetryRainfall" data', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    const todayYearMonDay = moment().subtract(5, 'days').format('YYYY-MM-DD')

    expect(Result.telemetryRainfall.latestDateTime).toBe('2022-02-09T09:15:00.000Z')
    expect(Result.telemetryRainfall.dataStartDateTime).toContain(todayYearMonDay)
    expect(Result.telemetryRainfall.rangeStartDateTime).toContain(todayYearMonDay)
    expect(Result.telemetryRainfall.latest1hr).toBe('3.21')
    expect(Result.telemetryRainfall.latest6hr).toBe('15.23')
    expect(Result.telemetryRainfall.latest24hr).toBe('20.00')
    expect(Result.telemetryRainfall.minutes.latestDateTime).toBe('2022-02-09T09:15:00.000Z')
    expect(Result.telemetryRainfall.minutes.values.length).toBeGreaterThan(0)
  })

  it('should return formatted dates', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.latestDayFormatted).toBe('9 February')
    expect(Result.latestTimeFormatted).toBe('9:15am')
  })

  it('should construct station id correctly', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.id).toBe('E24195.Anglian')
  })

  it('should populate lat/long in centroid', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)
    const Result = viewModel

    expect(Result.centroid[0]).toBeCloseTo(-0.60409807, 7)
    expect(Result.centroid[1]).toBeCloseTo(51.34453211, 7)
  })

  it('should return "telemetryRainfall" data with station using 1hr periods', async () => {
    const rainfallTelemetryData = data.rainfallStationhrTelemetry
    const rainfallStationData = data.hrRainfallStation
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.telemetryRainfall.latestDateTime).toBe('2022-02-15T09:00:00.000Z')
    expect(Result.telemetryRainfall.dataStartDateTime).toBe(moment().subtract(5, 'days').format())
    expect(Result.telemetryRainfall.rangeStartDateTime).toBe(moment().subtract(5, 'days').format())
    expect(Result.telemetryRainfall.latest1hr).toBe('0.00')
    expect(Result.telemetryRainfall.latest6hr).toBe('0.00')
    expect(Result.telemetryRainfall.latest24hr).toBe('1.10')
    expect(Result.telemetryRainfall).not.toContainKey('minutes')
  })

  it('should return metadata and social details correctly', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.pageTitle).toBe('Rainfall at Lavenham gauge')
    expect(Result.postTitle).toBe('Latest rainfall information at Lavenham gauge')
    expect(Result.metaDescription).toBe('Check the latest recorded rainfall at Lavenham gauge')
  })

  it('should return "displayGetWarningsLink" with appropriate Value', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')

    const result = new ViewModel(rainfallTelemetryData, rainfallStationData)

    expect(result.displayGetWarningsLink).toBe(true)
    expect(result.displayLongTermLink).toBe(true)
  })

  it('should default "telemetry" to an empty array when no telemetry is provided', async () => {
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')

    const result = new ViewModel(undefined, rainfallStationData)

    expect(result.telemetry).toEqual([])
    expect(result.telemetryRainfall).toBeUndefined()
    expect(result.outOfDate).toBeUndefined()
  })

  it('should not flag "outOfDate" when the latest telemetry is recent', async () => {
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const telemetry = [{ period: '15 min', value: '0.2', value_timestamp: moment().subtract(1, 'hour').toISOString() }]

    const result = new ViewModel(telemetry, rainfallStationData)

    expect(result.outOfDate).toBe('')
  })
})
