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
    const rainfallData = data.rainfall
    const rainfallTotalsData = data.rainfallTotals.filter(function (rainfallTotal) { return rainfallTotal.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallData, rainfallTotalsData)

    const Result = viewModel

    Code.expect(Result.stationName).to.equal('Lavenham')
    Code.expect(Result.telemetry.length).to.greaterThan(0)
    Code.expect(Result.telemetryRainfall.latest1hr).to.equal('3.21')
  })
  lab.test('Test Rainfall viewModel puts stationName as Title Case with multiple words in string', async () => {
    const rainfallData = data.rainfall
    const rainfallTotalsData = data.rainfallTotals.filter(function (rainfallTotal) { return rainfallTotal.station_reference === 'N24195' })
    const viewModel = new ViewModel(rainfallData, rainfallTotalsData)

    const Result = viewModel

    Code.expect(Result.stationName).to.equal('Newcastle Upon Tyne')
    Code.expect(Result.telemetry.length).to.greaterThan(0)
    Code.expect(Result.telemetryRainfall.latest1hr).to.equal('5.02')
  })
  lab.test('Test Rainfall viewModel returns telemetryRainfall data', async () => {
    const rainfallData = data.rainfall
    const rainfallTotalsData = data.rainfallTotals.filter(function (rainfallTotal) { return rainfallTotal.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallData, rainfallTotalsData)
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
    const rainfallData = data.rainfall
    const rainfallTotalsData = data.rainfallTotals.filter(function (rainfallTotal) { return rainfallTotal.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallData, rainfallTotalsData)

    const Result = viewModel

    Code.expect(Result.latestDayFormatted).to.equal('9th February')
    Code.expect(Result.latestTimeFormatted).to.equal('9:15am')
  })
  lab.test('Test Rainfall viewModel returns correct time period', async () => {
    const rainfallData = data.rainfall
    const rainfallTotalsData = data.rainfallTotals.filter(function (rainfallTotal) { return rainfallTotal.station_reference === 'E24195' })
    const viewModel = new ViewModel(rainfallData, rainfallTotalsData)

    const Result = viewModel

    Code.expect(Result.period).to.equal('15 min')
  })
})
