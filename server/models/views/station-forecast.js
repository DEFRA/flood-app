const moment = require('moment')
const severity = require('../severity')
const util = require('../../util')

function Forecast (data, isCoastal, latestObserved) {
  if (data.values && data.values.SetofValues.length > 0) {
    this.values = data.values.SetofValues[0].Value
  }

  this.hasForecastData = (!!this.values) && this.values.length > 0

  if (this.hasForecastData) {
    this.date = moment(data.values.forecast_date)
    this.forecastStart = latestObserved
      ? moment(latestObserved.ts)
      : moment(data.values.start_timestamp)

    this.truncateDate = isCoastal
      ? moment(this.forecastStart).add(5, 'days')
      : moment(this.forecastStart).add(36, 'hours')

    this.parameter = data.values.parameter
    this.qualifier = data.values.qualifier
    this.units = data.values.units
    this.startDate = moment(data.values.start_timestamp)
    this.endDate = moment(data.values.end_timestamp)

    // Process the values:
    // Truncate data to be 36 hours from forecast creation for riverlevels,
    // 5 days for coastal and get the highest value in this timeframe
    this.processedValues = []

    this.values.forEach(function (value) {
      value.ts = moment(value.$.date + 'T' + value.$.time + 'Z')
      value.formattedTimestamp = value.ts.format('MMMM Do YYYY, h:mm:ss a')
      if (value.ts.isBefore(this.forecastStart) || value.ts.isAfter(this.truncateDate)) {
        return
      }

      this.processedValues.push(value)

      if (!this.maxValue || (+value._ > +this.maxValue._)) {
        this.maxValue = value
      }
    }, this)

    // Check if we have any forecast values post processing
    if (!this.processedValues.length > 0) {
      this.hasForecastData = false
    }
  }

  this.hasWarnings = false
  this.warningMessage = ''
  this.warnings = {
    '-1': 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    FALThreshold: [],
    FWThreshold: []
  }

  // Sort the thresholds and get their severity object
  function sortThresholds (threshold) {
    if (threshold.fwa_severity > -1) {
      this.warnings[threshold.fwa_severity]++
      threshold.notification = severity[threshold.fwa_severity - 1]
    }

    switch (threshold.fwa_type) {
      case 'a':
        this.warnings.FALThreshold.push(threshold)
        break
      case 'w':
        this.warnings.FWThreshold.push(threshold)
        break
      default:
    }
  }
  data.thresholds.forEach(sortThresholds, this)

  this.hasWarnings = this.warnings[1] > 0 || this.warnings[2] > 0 || this.warnings[3] > 0

  if (this.hasWarnings) {
    if (this.warnings[1] === 1) {
      this.warningMessage = 'A severe flood warning is in place nearby.'
      this.warningSeverity = severity.getById(1)
    } else if (this.warnings[1] > 1) {
      this.warningMessage = 'Severe flood warnings are in place nearby.'
      this.warningSeverity = severity[0]
    } else if (this.warnings[2] === 1) {
      this.warningMessage = 'A flood warning is in place nearby.'
      this.warningSeverity = severity[1]
    } else if (this.warnings[2] > 1) {
      this.warningMessage = 'Flood warnings are in place nearby.'
      this.warningSeverity = severity[1]
    } else if (this.warnings[3] === 1) {
      this.warningMessage = 'A flood alert is in place nearby.'
      this.warningSeverity = severity[2]
    } else if (this.warnings[3] > 1) {
      this.warningMessage = 'Flood alerts are in place nearby.'
      this.warningSeverity = severity[2]
    }
  }

  this.alertThreshold = this.warnings.FALThreshold.length > 0
    ? util.toFixed(this.warnings.FALThreshold[0].value, 2)
    : undefined

  this.warningThreshold = this.warnings.FWThreshold.length > 0
    ? util.toFixed(this.warnings.FWThreshold[0].value, 2)
    : undefined

  // client side JSON
  this.forecastJSON = JSON.stringify({
    hasForecast: this.hasForecastData,
    alertThreshold: this.alertThreshold,
    warningThreshold: this.warningThreshold,
    maxValue: this.maxValue
  })
}

module.exports = Forecast
