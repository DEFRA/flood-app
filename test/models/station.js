'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../server/models/views/station')
const data = require('../data')
const moment = require('moment-timezone')

lab.experiment('Station model test', () => {
  let sandbox

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
    Code.expect(Result.alertsBanner).to.equal('There is a flood alert within 5 miles of this measuring station')
    Code.expect(Result.alertsLink).to.equal('/target-area/061FAG30Alton')
  })
  lab.test('Test station viewModel one Severe Warning in force', async () => {
    const stationData = data.stationSevereWarning

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.banner).to.equal(1)
    Code.expect(Result.severityLevel).to.equal('severe')
    Code.expect(Result.severeBanner).to.equal('Severe flood warning for Coast from Fleetwood to Blackpool')
    Code.expect(Result.severeLink).to.equal('/target-area/012WACFB')
  })
  lab.test('Test station viewModel multiple Warnings and Alerts in force', async () => {
    const stationData = data.stationMultipleAW

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.banner).to.equal(2)
    Code.expect(Result.severityLevel).to.equal('severe')
    Code.expect(Result.severeBanner).to.equal('There are severe flood warnings within 5 miles of this measuring station')
    Code.expect(Result.severeLink).to.equal('/alerts-and-warnings?station=1001#severe')
    Code.expect(Result.alertsBanner).to.equal('There are flood alerts within 5 miles of this measuring station')
    Code.expect(Result.alertsLink).to.equal('/alerts-and-warnings?station=1001#alerts')
    Code.expect(Result.warningsBanner).to.equal('There are flood warnings within 5 miles of this measuring station')
    Code.expect(Result.warningsLink).to.equal('/alerts-and-warnings?station=1001#warnings')
  })
  lab.test('Test station viewModel groundwater station', async () => {
    const stationData = data.stationGroudwater

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(9302)
    Code.expect(Result.station.river).to.equal('Groundwater Level')
    Code.expect(Result.station.hasPercentiles).to.equal(true)
    Code.expect(Result.station.hasImpacts).to.equal(false)
  })
  lab.test('Test station viewModel plotNegativeValues should be true for groundwater station', async () => {
    const viewModel = new ViewModel(data.stationGroudwater)
    Code.expect(viewModel.station.plotNegativeValues).to.equal(true)
  })
  lab.test('Test station viewModel plotNegativeValues should be false for river station', async () => {
    const viewModel = new ViewModel(data.stationRiver)
    Code.expect(viewModel.station.plotNegativeValues).to.equal(false)
  })
  lab.test('Test station viewModel plotNegativeValues should be true for coastal station', async () => {
    const viewModel = new ViewModel(data.stationCoastal)
    Code.expect(viewModel.station.plotNegativeValues).to.equal(true)
  })
  lab.test('Test station viewModel FFOI station with Impacts', async () => {
    const stationData = data.stationForecastData

    const today = moment().format('YYYY-MM-DD')
    const latestTime = moment().add(30, 'minutes').format('HH:mm:ss')
    const forecastBegining = moment().add(45, 'minutes').format('HH:mm:ss')

    const tommorowDate = moment().add(1, 'day').format('YYYY-MM-DD')
    const tommorowForecast = moment().add(1, 'day').format('HH:mm:ss')

    const outsideOfForecast = moment().add(37, 'hours').format('YYYY-MM-DD')
    const timeOutsideOfForecast = moment().add(37, 'hours').format('HH:mm:ss')

    stationData.values.$.date = today
    stationData.values.$.time = moment().format('HH:mm:ss')

    stationData.values.SetofValues[0].$.startDate = today
    stationData.values.SetofValues[0].$.startTime = moment().format('HH:mm:ss')

    stationData.values.SetofValues[0].$.endDate = moment().add(36, 'hours').format('YYYY-MM-DD')
    stationData.values.SetofValues[0].$.startTime = moment().add(36, 'hours').format('HH:mm:ss')

    stationData.values.SetofValues[0].Value[0].$.date = today
    stationData.values.SetofValues[0].Value[0].$.time = latestTime

    stationData.values.SetofValues[0].Value[1].$.date = today
    stationData.values.SetofValues[0].Value[1].$.time = forecastBegining

    stationData.values.SetofValues[0].Value[2].$.date = tommorowDate
    stationData.values.SetofValues[0].Value[2].$.time = tommorowForecast

    stationData.values.SetofValues[0].Value[3].$.date = outsideOfForecast
    stationData.values.SetofValues[0].Value[3].$.time = timeOutsideOfForecast

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(7177)
    Code.expect(Result.station.hasImpacts).to.equal(true)
    Code.expect(Result.station.formattedPorMaxDate).to.equal('10/02/09')
    Code.expect(Result.thresholds[0].level).to.equal('2.35')
    Code.expect(Result.isUpstream).to.equal(true)
    Code.expect(Result.isDownstream).to.equal(false)
    Code.expect(Result.severeBanner).to.equal('Severe flood warning for Coast from Fleetwood to Blackpool')
  })
  lab.test('Test station viewModel 1 alert 1 warning 1 severe', async () => {
    const stationData = data.stationAWSW

    const viewModel = new ViewModel(stationData)

    const Result = viewModel

    Code.expect(Result.station.id).to.equal(1001)
    Code.expect(Result.warningsBanner).to.equal('There is a flood warning within 5 miles of this measuring station')
  })
})
