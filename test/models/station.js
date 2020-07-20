'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../server/models/views/station')
const data = require('../data')

lab.experiment('Station model test', () => {
  let sandbox

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.test('Test station viewModel river station 1001, no alerts or warnings', async () => {
    const stationData = data.stationRiver
    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.station.hasPercentiles).to.equal(true)
    Code.expect(Result.station.isSingle).to.equal(true)
    Code.expect(Result.station.state).to.equal('Normal')
    Code.expect(Result.station.stateInformation).to.equal('0.35m to 2.84m')
    Code.expect(Result.station.status).to.equal('active')
    Code.expect(Result.banner).to.equal(0)
    Code.expect(Result.pageTitle).to.equal('River Adur level at Beeding Bridge')
    Code.expect(Result.dataOverHourOld).to.equal(true)
  })
  lab.test('Test station viewModel dataOverHourOld to be false', async () => {
    const stationData = data.stationRiver
    stationData.telemetry[0].ts = new Date().toJSON()

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.dataOverHourOld).to.equal(false)
  })
  lab.test('Test station viewModel one warning in force', async () => {
    const stationData = data.stationActiveWarning

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.banner).to.equal(1)
    Code.expect(Result.severityLevel).to.equal('warning')
    Code.expect(Result.warningsBanner).to.equal('Flood warning for Coast from Fleetwood to Blackpool')
    Code.expect(Result.warningsLink).to.equal('/target-area/012WACFB')
  })
  lab.test('Test station viewModel one alert in force', async () => {
    const stationData = data.stationActiveAlert

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.banner).to.equal(1)
    Code.expect(Result.severityLevel).to.equal('alert')
    Code.expect(Result.alertsBanner).to.equal('There is a flood alert in this area')
    Code.expect(Result.alertsLink).to.equal('/target-area/061FAG30Alton')
  })
  lab.test('Test station viewModel one Severe Warning in force', async () => {
    const stationData = data.stationSevereWarning

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.banner).to.equal(1)
    Code.expect(Result.severityLevel).to.equal('warning')
    Code.expect(Result.severeBanner).to.equal('Severe flood warning for Coast from Fleetwood to Blackpool')
    Code.expect(Result.severeLink).to.equal('/target-area/012WACFB')
  })
  lab.test('Test station viewModel multiple Warnings and Alerts in force', async () => {
    const stationData = data.stationMultipleAW

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.banner).to.equal(2)
    Code.expect(Result.severityLevel).to.equal('warning')
    Code.expect(Result.severeBanner).to.equal('2 severe flood warnings')
    Code.expect(Result.severeLink).to.equal('/alerts-and-warnings?station=1001#severe')
    Code.expect(Result.alertsBanner).to.equal('2 flood alerts')
    Code.expect(Result.alertsLink).to.equal('/alerts-and-warnings?station=1001#alerts')
    Code.expect(Result.warningsBanner).to.equal('2 flood warnings')
    Code.expect(Result.warningsLink).to.equal('/alerts-and-warnings?station=1001#warnings')
  })
  lab.test('Test station viewModel groundwater station', async () => {
    const stationData = data.stationGroudwater

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(9302)
    Code.expect(Result.station.river).to.equal('Groundwater Level')
    Code.expect(Result.station.hasPercentiles).to.equal(true)
  })
  lab.test('Test station viewModel FFOI station with Impacts', async () => {
    const stationData = data.stationForecastData

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(7177)
    Code.expect(Result.station.hasImpacts).to.equal(true)
    Code.expect(Result.station.formattedPorMaxDate).to.equal('10/02/09')
    Code.expect(Result.thresholds[0].level).to.equal('2.35')
    Code.expect(Result.isUpstream).to.equal(true)
    Code.expect(Result.isDownstream).to.equal(false)
  })
  lab.test('Test station viewModel 1 alert 1 warning 1 severe', async () => {
    const stationData = data.stationAWSW

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.warningAnd).to.equal(' and ')
    Code.expect(Result.warningsBanner).to.equal('1 flood warning')
  })
})
