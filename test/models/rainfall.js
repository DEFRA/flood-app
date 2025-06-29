'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../server/models/views/rainfall')
const data = require('../data')
const moment = require('moment-timezone')

describe('Model - Rainfall', () => {
  let sandbox

  beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })

  afterEach(async () => {
    await sandbox.restore()
  })

  it('should return single-word "stationName" in title case', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)
    const Result = viewModel

    expect(Result.stationName).to.equal('Lavenham')
    expect(Result.telemetry.length).to.greaterThan(0)
    expect(Result.telemetryRainfall.latest1hr).to.equal('3.2')
  })

  it('should return mutli-word "stationName" in title case', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'N24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.stationName).to.equal('Newcastle Upon Tyne')
    expect(Result.telemetry.length).to.greaterThan(0)
    expect(Result.telemetryRainfall.latest1hr).to.equal('5.0')
  })

  it('should return "telemetryRainfall" data', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    const todayYearMonDay = moment().subtract(5, 'days').format('YYYY-MM-DD')

    expect(Result.telemetryRainfall.latestDateTime).to.equal('2022-02-09T09:15:00.000Z')
    expect(Result.telemetryRainfall.dataStartDateTime).to.contain(todayYearMonDay)
    expect(Result.telemetryRainfall.rangeStartDateTime).to.contain(todayYearMonDay)
    expect(Result.telemetryRainfall.latest1hr).to.equal('3.2')
    expect(Result.telemetryRainfall.latest6hr).to.equal('15.2')
    expect(Result.telemetryRainfall.latest24hr).to.equal('20.0')
    expect(Result.telemetryRainfall.minutes.latestDateTime).to.equal('2022-02-09T09:15:00.000Z')
    expect(Result.telemetryRainfall.minutes.values.length).to.greaterThan(0)
  })

  it('should return formatted dates', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.latestDayFormatted).to.equal('9 February')
    expect(Result.latestTimeFormatted).to.equal('9:15am')
  })

  it('should construct station id correctly', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.id).to.equal('E24195.Anglian')
  })

  it('should populate lat/long in centroid', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)
    const Result = viewModel

    expect(Result.centroid[0]).to.equal(-0.60409807)
    expect(Result.centroid[1]).to.equal(51.34453211)
  })

  it('should return "telemetryRainfall" data with station using 1hr periods', async () => {
    const rainfallTelemetryData = data.rainfallStationhrTelemetry
    const rainfallStationData = data.hrRainfallStation
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.telemetryRainfall.latestDateTime).to.equal('2022-02-15T09:00:00.000Z')
    expect(Result.telemetryRainfall.dataStartDateTime).to.equal(moment().subtract(5, 'days').format())
    expect(Result.telemetryRainfall.rangeStartDateTime).to.equal(moment().subtract(5, 'days').format())
    expect(Result.telemetryRainfall.latest1hr).to.equal('0.0')
    expect(Result.telemetryRainfall.latest6hr).to.equal('0.0')
    expect(Result.telemetryRainfall.latest24hr).to.equal('1.1')
    expect(Result.telemetryRainfall).to.not.contain(Result.telemetryRainfall.minutes)
  })

  it('should return metadata and social details correctly', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    expect(Result.pageTitle).to.equal('Rainfall at Lavenham gauge')
    expect(Result.postTitle).to.equal('Latest rainfall information at Lavenham gauge')
    expect(Result.metaDescription).to.equal('Check the latest recorded rainfall at Lavenham gauge')
  })

  it('should return "displayGetWarningsLink" with appropriate Value', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.find(item => item.station_reference === 'E24195')

    const result = new ViewModel(rainfallTelemetryData, rainfallStationData)

    expect(result.displayGetWarningsLink).to.equal(true)
    expect(result.displayLongTermLink).to.equal(true)
  })
})
