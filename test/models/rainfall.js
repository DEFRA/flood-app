'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../server/models/views/rainfall')
const data = require('../data')
const moment = require('moment-timezone')

lab.experiment('Rainfall model test', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })

  lab.test('Test Rainfall viewModel puts stationName as Title Case', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.filter(function (rainfallStation) { return rainfallStation.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)
    const Result = viewModel

    Code.expect(Result.stationName).to.equal('Lavenham')
    Code.expect(Result.telemetry.length).to.greaterThan(0)
    Code.expect(Result.telemetryRainfall.latest1hr).to.equal('3.21')
  })
  lab.test('Test Rainfall viewModel puts stationName as Title Case with multiple words in string', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.filter(function (rainfallStation) { return rainfallStation.station_reference === 'N24195' })
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    Code.expect(Result.stationName).to.equal('Newcastle Upon Tyne')
    Code.expect(Result.telemetry.length).to.greaterThan(0)
    Code.expect(Result.telemetryRainfall.latest1hr).to.equal('5.02')
  })
  lab.test('Test Rainfall viewModel returns telemetryRainfall data', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.filter(function (rainfallStation) { return rainfallStation.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    Code.expect(Result.telemetryRainfall.latestDateTime).to.equal('2022-02-09T09:15:00.000Z')
    Code.expect(Result.telemetryRainfall.dataStartDateTime).to.equal(moment().subtract(5, 'days').format())
    Code.expect(Result.telemetryRainfall.rangeStartDateTime).to.equal(moment().subtract(5, 'days').format())
    Code.expect(Result.telemetryRainfall.latest1hr).to.equal('3.21')
    Code.expect(Result.telemetryRainfall.latest6hr).to.equal('15.23')
    Code.expect(Result.telemetryRainfall.latest24hr).to.equal('20.00')
    Code.expect(Result.telemetryRainfall.minutes.latestDateTime).to.equal('2022-02-09T09:15:00.000Z')
    Code.expect(Result.telemetryRainfall.minutes.values.length).to.greaterThan(0)
  })
  lab.test('Test dates are formatted correctly for the view', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.filter(function (rainfallStation) { return rainfallStation.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    Code.expect(Result.latestDayFormatted).to.equal('9th February')
    Code.expect(Result.latestTimeFormatted).to.equal('9:15am')
  })
  lab.test('Test lat/long are populated in centroid', async () => {
    const rainfallTelemetryData = data.rainfallStationTelemetry
    const rainfallStationData = data.rainfallStation.filter(function (rainfallStation) { return rainfallStation.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)
    const Result = viewModel

    Code.expect(Result.centroid[0]).to.equal(2.8074515304839753)
    Code.expect(Result.centroid[1]).to.equal(56.103262968744666)
  })
  lab.test('Test Rainfall viewModel returns telemetryRainfall data with station using 1hr periods', async () => {
    const rainfallTelemetryData = data.rainfallStationhrTelemetry
    const rainfallStationData = data.hrRainfallStation
    const viewModel = new ViewModel(rainfallTelemetryData, rainfallStationData)

    const Result = viewModel

    Code.expect(Result.telemetryRainfall.latestDateTime).to.equal('2022-02-15T09:00:00.000Z')
    Code.expect(Result.telemetryRainfall.dataStartDateTime).to.equal(moment().subtract(5, 'days').format())
    Code.expect(Result.telemetryRainfall.rangeStartDateTime).to.equal(moment().subtract(5, 'days').format())
    Code.expect(Result.telemetryRainfall.latest1hr).to.equal('0')
    Code.expect(Result.telemetryRainfall.latest6hr).to.equal('0')
    Code.expect(Result.telemetryRainfall.latest24hr).to.equal('1.1')
    Code.expect(Result.telemetryRainfall.minutes.latestDateTime).to.equal('2022-02-15T09:00:00.000Z')
    Code.expect(Result.telemetryRainfall.minutes.values.length).to.greaterThan(0)
  })
})
