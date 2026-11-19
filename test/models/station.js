'use strict'

const ViewModel = require('../../server/models/views/station')
const data = require('../data')
const moment = require('moment-timezone')

describe('Model - Station', () => {
  it('should return no alerts or warnings', () => {
    const stationData = data.stationRiver
    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(1001)
    expect(viewModel.station.hasPercentiles).toBe(true)
    expect(viewModel.station.isSingle).toBe(true)
    expect(viewModel.station.state).toBe('Normal')
    expect(viewModel.station.stateInformation).toBe('0.35m to 2.84m')
    expect(viewModel.station.status).toBe('active')
    expect(viewModel.trend).toBe('steady')
    expect(viewModel.banner).toBe(0)
    expect(viewModel.pageTitle).toBe('River Adur level at Beeding Bridge')
    expect(viewModel.dataOverHourOld).toBe(true)
    expect(viewModel.postTitle).toBe('Latest river level information for the River Adur at Beeding Bridge ')
    expect(viewModel.thresholds[0].values).toEqual([
      {
        id: 'warningThreshold',
        description: 'Property flooding is possible above this level',
        shortname: 'Possible flood warnings',
        value: '3.64'
      }
    ])
    expect(viewModel.thresholds[2].values).toEqual([
      {
        id: 'alertThreshold',
        description: 'Low-lying land flooding possible above this level. One or more flood alerts may be issued.',
        shortname: 'Possible flood alerts',
        value: '3.22'
      }
    ])
    expect(viewModel.thresholds[4].values).toEqual([
      {
        id: 'latest',
        value: '0.81',
        description: 'Latest level',
        shortname: ''
      }
    ])
  })

  it('should only have FW ATCON thresholds from river station', () => {
    const stationData = data.stationRiverACTCON
    const viewModel = new ViewModel(stationData)

    expect(viewModel.thresholds[1].values).toEqual([
      {
        id: 'warningThreshold',
        description: 'Property flooding is possible above this level',
        shortname: 'Possible flood warnings',
        value: '3.22'
      }
    ])
    expect(viewModel.thresholds[2].values).toEqual([
      {
        id: 'alertThreshold',
        description: 'Top of normal range. Low-lying land flooding possible above this level. One or more flood alerts may be issued.',
        shortname: 'Top of normal range',
        value: '2.84'
      }
    ])
  })

  it('should set "dataOverHourOld" to be false', () => {
    const stationData = data.stationRiver
    stationData.telemetry[0].ts = new Date().toJSON()

    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(1001)
    expect(viewModel.dataOverHourOld).toBe(false)
  })

  it('should return one warning in force', () => {
    const stationData = data.stationActiveWarning

    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(1001)
    expect(viewModel.banner).toBe(1)
    expect(viewModel.severityLevel).toBe('warning')
    expect(viewModel.warningsBanner).toBe('Flood warning for Coast from Fleetwood to Blackpool')
    expect(viewModel.warningsLink).toBe('/target-area/012WACFB')
  })

  it('should return one alert in force', () => {
    const stationData = data.stationActiveAlert

    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(1001)
    expect(viewModel.banner).toBe(1)
    expect(viewModel.severityLevel).toBe('alert')
    expect(viewModel.alertsBanner).toBe('There is a flood alert within 5 miles of this measuring station')
    expect(viewModel.alertsLink).toBe('/target-area/061FAG30Alton')
  })

  it('should return one severe warning in force', () => {
    const stationData = data.stationSevereWarning

    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(1001)
    expect(viewModel.banner).toBe(1)
    expect(viewModel.severityLevel).toBe('severe')
    expect(viewModel.severeBanner).toBe('Severe flood warning for Coast from Fleetwood to Blackpool')
    expect(viewModel.severeLink).toBe('/target-area/012WACFB')
  })

  it('should return multiple warnings and alerts in force', () => {
    const stationData = data.stationMultipleAW

    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(1001)
    expect(viewModel.banner).toBe(2)
    expect(viewModel.severityLevel).toBe('severe')
    expect(viewModel.severeBanner).toBe('There are severe flood warnings within 5 miles of this measuring station')
    expect(viewModel.severeLink).toBe('/alerts-and-warnings?station=1001#severe')
    expect(viewModel.alertsBanner).toBe('There are flood alerts within 5 miles of this measuring station')
    expect(viewModel.alertsLink).toBe('/alerts-and-warnings?station=1001#alerts')
    expect(viewModel.warningsBanner).toBe('There are flood warnings within 5 miles of this measuring station')
    expect(viewModel.warningsLink).toBe('/alerts-and-warnings?station=1001#warnings')
  })

  it('should return a groundwater station', () => {
    const stationData = data.stationGroudwater

    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(9302)
    expect(viewModel.station.river).toBe('Groundwater Level')
    expect(viewModel.station.hasPercentiles).toBe(true)
    expect(viewModel.station.hasImpacts).toBe(false)
  })

  it('should set "plotNegativeValues" as true for groundwater station', () => {
    const viewModel = new ViewModel(data.stationGroudwater)
    expect(viewModel.station.plotNegativeValues).toBe(true)
  })

  it('should set "plotNegativeValues" as false for river station', () => {
    const viewModel = new ViewModel(data.stationRiver)
    expect(viewModel.station.plotNegativeValues).toBe(false)
  })

  it('should set "plotNegativeValues" as true for coastal station', () => {
    const viewModel = new ViewModel(data.stationCoastal)
    expect(viewModel.station.plotNegativeValues).toBe(true)
  })

  it('should return impacts for FFOI station', () => {
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

    expect(viewModel.station.id).toBe(7177)
    expect(viewModel.station.hasImpacts).toBe(true)
    expect(viewModel.station.formattedPorMaxDate).toBe('10/02/09')

    // Should have FW ACT FAL 3.88 and FW ACT FW 4.20 thresholds as the are no FW RES FAL and FW RES FW in imtdThresholds
    expect(viewModel.thresholds[0].values).toEqual(
      [
        {
          description: 'Property flooding is possible above this level',
          id: 'warningThreshold',
          shortname: 'Possible flood warnings',
          value: '4.20'
        }
      ]
    )
    expect(viewModel.thresholds[1].values).toEqual(
      [
        {
          id: 'alertThreshold',
          description: 'Low-lying land flooding possible above this level. One or more flood alerts may be issued.',
          shortname: 'Possible flood alerts',
          value: '3.88'
        }
      ]
    )
    expect(viewModel.isUpstream).toBe(true)
    expect(viewModel.isDownstream).toBe(false)
    expect(viewModel.severeBanner).toBe('Severe flood warning for Coast from Fleetwood to Blackpool')
  })

  it('should return 1 alert, 1 warning and 1 severe', () => {
    const stationData = data.stationAWSW

    const viewModel = new ViewModel(stationData)

    expect(viewModel.station.id).toBe(1001)
    expect(viewModel.warningsBanner).toBe('There is a flood warning within 5 miles of this measuring station')
  })

  it('should remove spike in telemetry', () => {
    const stationData = data.stationRiverSpike
    const viewModel = new ViewModel(stationData)

    // 480 telemetry values went in to the model, should be one less
    expect(viewModel.telemetry.length).toBe(479)
  })

  it('should return sea level height toggle tip', () => {
    const stationData = data.toggleTipSeaLevelStation

    const viewModel = new ViewModel(stationData)

    expect(viewModel.infoHeight).toBe('This station measures height from sea level.')
    expect(viewModel.infoTrend).toBe('The trend is based on the last 5 readings.')
    expect(viewModel.infoState).toBe('There are 3 states: low, normal and high. The latest level is within the normal range. We calculate the normal range using an average of past measurements and other local factors.')
  })

  it('should return below zero height toggle tip', () => {
    const stationData = data.toggleTipBelowZeroStation

    const viewModel = new ViewModel(stationData)

    expect(viewModel.infoHeight).toBe('This station measures height from a fixed point on or close to the riverbed. A reading of 0 metres can be normal for some stations because of natural changes to the riverbed.')
    expect(viewModel.infoTrend).toBe('The trend is based on the last 5 readings.')
    expect(viewModel.infoState).toBe('There are 3 states: low, normal and high. The latest level is below the normal range. We calculate the normal range using an average of past measurements and other local factors.')
  })

  it('should return river bed height toggle tip', () => {
    const stationData = data.toggleTipRiverBedStation

    const viewModel = new ViewModel(stationData)

    expect(viewModel.infoHeight).toBe('This station measures height from a fixed point on or close to the riverbed. This point is 5.63m above sea level.')
    expect(viewModel.infoTrend).toBe('The trend is based on the last 5 readings.')
    expect(viewModel.infoState).toBe('There are 3 states: low, normal and high. The latest level is above the normal range. We calculate the normal range using an average of past measurements and other local factors.')
  })

  it('should remove null value telemetry', () => {
    const stationData = data.nullTelemetry

    const viewModel = new ViewModel(stationData)

    expect(viewModel.telemetryRefined.observed.length).toBe(4)
  })
})
