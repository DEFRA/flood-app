'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const ViewModel = require('../../server/models/views/location')
const data = require('../data')

lab.experiment('Outlook model test', () => {
  let sandbox

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
  })
  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.test('Test location viewModel a with flood warning', async () => {
    const floodWarning = data.floodWarning
    const viewModel = new ViewModel(floodWarning)

    const Result = await viewModel

    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    Code.expect(Result.place.name).to.equal('Keswick, Cumbria')
    Code.expect(Result.bannerMainText).to.equal('Flood warning for Keswick Campsite')
    Code.expect(Result.bannerMainLink).to.equal('/target-area/011FWFNC6KC')
    Code.expect(Result.bannerSub).to.equal('Flooding is expected')
  })
  lab.test('Test location viewModel a with flood alert', async () => {
    const floodAlert = data.floodAlert
    const viewModel = new ViewModel(floodAlert)

    const Result = await viewModel

    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Alert')
    Code.expect(Result.place.name).to.equal('Keswick, Cumbria')
    Code.expect(Result.bannerMainText).to.equal('There is a flood alert in this area')
    Code.expect(Result.bannerMainLink).to.equal('/target-area/011FWFNC6KC')
    Code.expect(Result.bannerSub).to.equal('Some flooding is possible')
  })
  lab.test('Test location viewModel a with Severe flood warning alert', async () => {
    const fakeSevereFloodWarning = data.severeFloodWarning
    const viewModel = new ViewModel(fakeSevereFloodWarning)

    const Result = await viewModel
    Code.expect(Result.floods[0].severitydescription).to.equal('Severe Flood Warning')
    Code.expect(Result.place.name).to.equal('Stonethwaite Beck')
    Code.expect(Result.bannerSevereMainText).to.equal('Severe flood warning for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    Code.expect(Result.bannerSevereMainLink).to.equal('/target-area/011WAFDW')
    Code.expect(Result.bannerSevereSub).to.equal('There is a danger to life')
    Code.expect(Result.floods.length).to.equal(1)
  })
  lab.test('Test location viewModel no warnings or alerts', async () => {
    const noWarningsOrAlerts = data.noWarningsOrAlerts
    const viewModel = new ViewModel(noWarningsOrAlerts)

    const Result = await viewModel

    Code.expect(Result.floods.length).to.equal(0)
  })
  lab.test('Test location viewModel with blank alert', async () => {
    const noFlooding = data.noFlooding
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    Code.expect(Result.floods.length).to.equal(0)
  })
  lab.test('Test this.hasFloodsList with flood warning and alert', async () => {
    const warningAndAlert = data.warningAndAlert
    const viewModel = new ViewModel(warningAndAlert)

    const Result = await viewModel

    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    Code.expect(Result.place.name).to.equal('Keswick, Cumbria')
    Code.expect(Result.bannerMainText).to.equal('Flood warning for Keswick Campsite')
    Code.expect(Result.bannerMainLink).to.equal('/target-area/011FWFNC6KC')
    Code.expect(Result.bannerSub).to.equal('Flooding is expected')
    Code.expect(Result.alertsSummaryLink).to.equal('/target-area/011WAFDW')
    Code.expect(Result.alertsSummaryLinkText).to.equal('A flood alert')
    Code.expect(Result.alertsSummaryText).to.equal('is')
  })
  lab.test('Test alternate primaryStatement with multiple Flood Alert', async () => {
    const multipleFloodAlerts = data.multipleFloodAlerts
    const viewModel = new ViewModel(multipleFloodAlerts)

    const Result = await viewModel
    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Alert')
    Code.expect(Result.place.name).to.equal('Keswick, Cumbria')
    Code.expect(Result.bannerMainText).to.equal('2 flood alerts in this area')
    Code.expect(Result.bannerMainLink).to.equal('/alerts-and-warnings?q=Keswick#alerts')
    Code.expect(Result.bannerSub).to.equal('Some flooding is possible')
  })
  lab.test('Test alternate primaryStatement with multiple Flood Warnings', async () => {
    const multipleFloodWarnings = data.multipleFloodWarnings
    const viewModel = new ViewModel(multipleFloodWarnings)

    const Result = await viewModel

    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    Code.expect(Result.place.name).to.equal('Keswick, Cumbria')
    Code.expect(Result.bannerMainText).to.equal('3 flood warnings in this area')
    Code.expect(Result.bannerMainLink).to.equal('/alerts-and-warnings?q=Keswick#warnings')
    Code.expect(Result.bannerSub).to.equal('Flooding is expected')
  })
  lab.test('Test alternate primaryStatement with multiple Severe Flood Warnings', async () => {
    const multipleSevereFloodWarnings = data.multipleSevereFloodWarnings
    const viewModel = new ViewModel(multipleSevereFloodWarnings)

    const Result = await viewModel

    Code.expect(Result.floods[0].severitydescription).to.equal('Severe Flood Warning')
    Code.expect(Result.place.name).to.equal('Keswick, Cumbria')
    Code.expect(Result.bannerSevereMainText).to.equal('2 severe flood warnings in this area')
    Code.expect(Result.bannerSevereMainLink).to.equal('/alerts-and-warnings?q=Keswick#severe')
    Code.expect(Result.bannerSevereSub).to.equal('There is a danger to life')
  })
  lab.test('Test Flood Warning at Coastal Station', async () => {
    const floodWarningCoastal = data.floodWarningCoastal
    const viewModel = new ViewModel(floodWarningCoastal)

    const Result = await viewModel
    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    Code.expect(Result.place.name).to.equal('Station, Coastal')
    Code.expect(Result.bannerMainText).to.equal('Flood warning for Coastal Station')
    Code.expect(Result.bannerMainLink).to.equal('/target-area/011TESTC6KC')
    Code.expect(Result.bannerSub).to.equal('Flooding is expected')
  })
  lab.test('Test Station level get set to High', async () => {
    const floodWarningStationHigh = data.floodWarningStationHigh
    const viewModel = new ViewModel(floodWarningStationHigh)

    const Result = await viewModel
    Code.expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    Code.expect(Result.place.name).to.equal('Station, Coastal')
    Code.expect(Result.bannerMainText).to.equal('Flood warning for High level Station')
    Code.expect(Result.bannerMainLink).to.equal('/target-area/011TESTC6KC')
    Code.expect(Result.bannerSub).to.equal('Flooding is expected')
  })
})
