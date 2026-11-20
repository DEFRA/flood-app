'use strict'

const ViewModel = require('../../server/models/views/location')
const data = require('../data')

describe('Model - Location', () => {
  it('should return a flood warning', async () => {
    const floodWarning = data.floodWarning
    const viewModel = new ViewModel(floodWarning)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).toBe('Flood Warning')
    expect(Result.place.name).toBe('Keswick, Cumbria')
    expect(Result.bannerMainText).toBe('Flood warning for Keswick Campsite')
    expect(Result.bannerMainLink).toBe('/target-area/011FWFNC6KC')
    expect(Result.bannerSub).toBe('Flooding is expected')
  })

  it('should return a flood alert', async () => {
    const floodAlert = data.floodAlert
    const viewModel = new ViewModel(floodAlert)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).toBe('Flood Alert')
    expect(Result.place.name).toBe('Keswick, Cumbria')
    expect(Result.bannerMainText).toBe('There is a flood alert in this area')
    expect(Result.bannerMainLink).toBe('/target-area/011FWFNC6KC')
    expect(Result.bannerSub).toBe('Some flooding is possible')
  })

  it('should return a Severe flood warning alert', async () => {
    const fakeSevereFloodWarning = data.severeFloodWarning
    const viewModel = new ViewModel(fakeSevereFloodWarning)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).toBe('Severe Flood Warning')
    expect(Result.place.name).toBe('Stonethwaite Beck')
    expect(Result.bannerSevereMainText).toBe('Severe flood warning for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    expect(Result.bannerSevereMainLink).toBe('/target-area/011WAFDW')
    expect(Result.bannerSevereSub).toBe('There is a danger to life')
    expect(Result.floods.length).toBe(1)
  })

  it('should return no warnings or alerts', async () => {
    const noWarningsOrAlerts = data.noWarningsOrAlerts
    const viewModel = new ViewModel(noWarningsOrAlerts)

    const Result = await viewModel

    expect(Result.floods.length).toBe(0)
  })

  it('should return with a blank alert', async () => {
    const noFlooding = data.noFlooding
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).toBe(0)
  })

  it('should return with multiple Flood Alerts', async () => {
    const multipleFloodAlerts = data.multipleFloodAlerts
    const viewModel = new ViewModel(multipleFloodAlerts)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).toBe('Flood Alert')
    expect(Result.place.name).toBe('Keswick, Cumbria')
    expect(Result.bannerMainText).toBe('2 flood alerts in this area')
    expect(Result.bannerMainLink).toBe('/alerts-and-warnings?q=Keswick#alerts')
    expect(Result.bannerSub).toBe('Some flooding is possible')
  })

  it('should return with multiple Flood Warnings', async () => {
    const multipleFloodWarnings = data.multipleFloodWarnings
    const viewModel = new ViewModel(multipleFloodWarnings)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).toBe('Flood Warning')
    expect(Result.place.name).toBe('Keswick, Cumbria')
    expect(Result.bannerMainText).toBe('3 flood warnings in this area')
    expect(Result.bannerMainLink).toBe('/alerts-and-warnings?q=Keswick#warnings')
    expect(Result.bannerSub).toBe('Flooding is expected')
  })

  it('should return with multiple Severe Flood Warnings', async () => {
    const multipleSevereFloodWarnings = data.multipleSevereFloodWarnings
    const viewModel = new ViewModel(multipleSevereFloodWarnings)

    const Result = await viewModel

    expect(Result.floods[0].severitydescription).toBe('Severe Flood Warning')
    expect(Result.place.name).toBe('Keswick, Cumbria')
    expect(Result.bannerSevereMainText).toBe('2 severe flood warnings in this area')
    expect(Result.bannerSevereMainLink).toBe('/alerts-and-warnings?q=Keswick#severe')
    expect(Result.bannerSevereSub).toBe('There is a danger to life')
  })

  it('should return Flood Warning with Coastal Station', async () => {
    const floodWarningCoastal = data.floodWarningCoastal
    const viewModel = new ViewModel(floodWarningCoastal)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).toBe('Flood Warning')
    expect(Result.place.name).toBe('Station, Coastal')
    expect(Result.bannerMainText).toBe('Flood warning for Coastal Station')
    expect(Result.bannerMainLink).toBe('/target-area/011TESTC6KC')
    expect(Result.bannerSub).toBe('Flooding is expected')
  })

  it('should return flood expected when a Station level is High', async () => {
    const floodWarningStationHigh = data.floodWarningStationHigh
    const viewModel = new ViewModel(floodWarningStationHigh)

    const Result = await viewModel
    expect(Result.floods[0].severitydescription).toBe('Flood Warning')
    expect(Result.place.name).toBe('Station, Coastal')
    expect(Result.bannerMainText).toBe('Flood warning for High level Station')
    expect(Result.bannerMainLink).toBe('/target-area/011TESTC6KC')
    expect(Result.bannerSub).toBe('Flooding is expected')
  })

  it('should return no warnings and no high level stations', async () => {
    const noFlooding = data.noFlooding
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).toBe(0)
    expect(Result.hasHighLevels).toBe(false)
  })

  it('should return no warnings and high level stations', async () => {
    const noFlooding = data.noFloodingAndHighLevels
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).toBe(0)
    expect(Result.hasHighLevels).toBe(true)
  })

  it('should return no warnings and high levels on inactive stations', async () => {
    const noFlooding = data.noFloodingAndHighLevelsInactive
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).toBe(0)
    expect(Result.hasHighLevels).toBe(false)
  })

  it('should return no warnings and high levels with variety of station types', async () => {
    const noFlooding = data.noFloodingAndHighLevelsExtra
    const viewModel = new ViewModel(noFlooding)

    const Result = await viewModel

    expect(Result.floods.length).toBe(0)
    expect(Result.hasHighLevels).toBe(true)
  })

  it('should show alert summary link when a flood alert accompanies a flood warning', async () => {
    const alertWithWarning = {
      ...data.floodAlert,
      floods: [
        ...data.floodAlert.floods,
        { ...data.floodWarning.floods[0], ta_code: 'WARN001' }
      ]
    }
    const viewModel = new ViewModel(alertWithWarning)

    expect(viewModel.alerts).toBe(1)
    expect(viewModel.alertsSummaryLinkText).toBe('1 flood alert')
    expect(viewModel.alertsSummaryText).toBe('is')
  })
})
