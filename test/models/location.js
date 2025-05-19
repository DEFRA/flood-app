'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const ViewModel = require('../../server/models/views/location')
const data = require('../data')

describe('Model - Location', () => {
  it('should return a flood warning', async () => {
    const floodWarning = data.floodWarning
    const viewModel = new ViewModel(floodWarning)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    expect(Result.place.name).to.equal('Keswick, Cumbria')
    expect(Result.bannerMainText).to.equal('Flood warning for Keswick Campsite')
    expect(Result.bannerMainLink).to.equal('/target-area/011FWFNC6KC')
    expect(Result.bannerSub).to.equal('Flooding is expected')
  })

  it('should return a flood alert', async () => {
    const floodAlert = data.floodAlert
    const viewModel = new ViewModel(floodAlert)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).to.equal('Flood Alert')
    expect(Result.place.name).to.equal('Keswick, Cumbria')
    expect(Result.bannerMainText).to.equal('There is a flood alert in this area')
    expect(Result.bannerMainLink).to.equal('/target-area/011FWFNC6KC')
    expect(Result.bannerSub).to.equal('Some flooding is possible')
  })

  it('should return a Severe flood warning alert', async () => {
    const fakeSevereFloodWarning = data.severeFloodWarning
    const viewModel = new ViewModel(fakeSevereFloodWarning)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).to.equal('Severe Flood Warning')
    expect(Result.place.name).to.equal('Stonethwaite Beck')
    expect(Result.bannerSevereMainText).to.equal('Severe flood warning for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    expect(Result.bannerSevereMainLink).to.equal('/target-area/011WAFDW')
    expect(Result.bannerSevereSub).to.equal('There is a danger to life')
    expect(Result.floods.length).to.equal(1)
  })

  it('should return no warnings or alerts', async () => {
    const noWarningsOrAlerts = data.noWarningsOrAlerts
    const viewModel = new ViewModel(noWarningsOrAlerts)

    const Result = await viewModel

    expect(Result.floods.length).to.equal(0)
  })

  it('should return with a blank alert', async () => {
    const noFlooding = data.noFlooding
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).to.equal(0)
  })

  it('should return with multiple Flood Alerts', async () => {
    const multipleFloodAlerts = data.multipleFloodAlerts
    const viewModel = new ViewModel(multipleFloodAlerts)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).to.equal('Flood Alert')
    expect(Result.place.name).to.equal('Keswick, Cumbria')
    expect(Result.bannerMainText).to.equal('2 flood alerts in this area')
    expect(Result.bannerMainLink).to.equal('/alerts-and-warnings?q=Keswick#alerts')
    expect(Result.bannerSub).to.equal('Some flooding is possible')
  })

  it('should return with multiple Flood Warnings', async () => {
    const multipleFloodWarnings = data.multipleFloodWarnings
    const viewModel = new ViewModel(multipleFloodWarnings)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    expect(Result.place.name).to.equal('Keswick, Cumbria')
    expect(Result.bannerMainText).to.equal('3 flood warnings in this area')
    expect(Result.bannerMainLink).to.equal('/alerts-and-warnings?q=Keswick#warnings')
    expect(Result.bannerSub).to.equal('Flooding is expected')
  })

  it('should return with multiple Severe Flood Warnings', async () => {
    const multipleSevereFloodWarnings = data.multipleSevereFloodWarnings
    const viewModel = new ViewModel(multipleSevereFloodWarnings)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).to.equal('Severe Flood Warning')
    expect(Result.place.name).to.equal('Keswick, Cumbria')
    expect(Result.bannerSevereMainText).to.equal('2 severe flood warnings in this area')
    expect(Result.bannerSevereMainLink).to.equal('/alerts-and-warnings?q=Keswick#severe')
    expect(Result.bannerSevereSub).to.equal('There is a danger to life')
  })

  it('should return Flood Warning with Coastal Station', async () => {
    const floodWarningCoastal = data.floodWarningCoastal
    const viewModel = new ViewModel(floodWarningCoastal)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    expect(Result.place.name).to.equal('Station, Coastal')
    expect(Result.bannerMainText).to.equal('Flood warning for Coastal Station')
    expect(Result.bannerMainLink).to.equal('/target-area/011TESTC6KC')
    expect(Result.bannerSub).to.equal('Flooding is expected')
  })

  it('should return flood expected when a Station level is High', async () => {
    const floodWarningStationHigh = data.floodWarningStationHigh
    const viewModel = new ViewModel(floodWarningStationHigh)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).to.equal('Flood Warning')
    expect(Result.place.name).to.equal('Station, Coastal')
    expect(Result.bannerMainText).to.equal('Flood warning for High level Station')
    expect(Result.bannerMainLink).to.equal('/target-area/011TESTC6KC')
    expect(Result.bannerSub).to.equal('Flooding is expected')
  })

  it('should return no warnings and no high level stations', async () => {
    const noFlooding = data.noFlooding
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).to.equal(0)
    expect(Result.hasHighLevels).to.be.false()
  })

  it('should return no warnings and high level stations', async () => {
    const noFlooding = data.noFloodingAndHighLevels
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).to.equal(0)
    expect(Result.hasHighLevels).to.be.true()
  })

  it('should return no warnings and high levels on inactive stations', async () => {
    const noFlooding = data.noFloodingAndHighLevelsInactive
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).to.equal(0)
    expect(Result.hasHighLevels).to.be.false()
  })

  it('should return no warnings and high levels with variety of station types', async () => {
    const noFlooding = data.noFloodingAndHighLevelsExtra
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).to.equal(0)
    expect(Result.hasHighLevels).to.be.true()
  })
})
