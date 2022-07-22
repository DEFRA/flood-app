const moment = require('moment-timezone')
const severity = require('../severity')
const util = require('../../util')

function ImtdThresholds (data, isCoastal, latestObserved) {
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
      const today = moment().startOf('day')
      const tomorrow = moment().add(1, 'days').startOf('day')
      let dateWhen = ' on ' + moment(value.ts).format('D/MM/YY')
      if (moment(value.ts).isSame(today, 'd')) {
        dateWhen = ' today'
      } else if (moment(value.ts).isSame(tomorrow, 'd')) {
        dateWhen = ' tomorrow'
      }
      value.formattedTimestamp = moment(value.ts).tz('Europe/London').format('h:mma') + dateWhen
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
  // TODO THIS NEEDS A REFACTOR BADLY
  // Sort the thresholds and get their severity object
  function sortThresholds (threshold) {
    // if (threshold.fwa_severity > -1) {
    //   this.warnings[threshold.fwa_severity]++
    //   threshold.notification = severity[threshold.fwa_severity - 1]
    // }

    // switch (threshold.fwa_type) {
    //   case 'a':
    //     this.warnings.FALThreshold.push(threshold)
    //     break
    //   case 'w':
    //     this.warnings.FWThreshold.push(threshold)
    //     break
    //   default:
    // }
  }
  data.thresholdsImtd.forEach(sortThresholds, this)

  this.hasWarnings = this.warnings[1] > 0 || this.warnings[2] > 0 || this.warnings[3] > 0

  if (this.hasWarnings) {
    if (this.warnings[3] === 1) {
      this.warningMessage = 'A severe flood warning is in place nearby.'
      this.warningSeverity = severity.filter(item => { return item.id === 3 })[0]
    } else if (this.warnings[3] > 1) {
      this.warningMessage = 'Severe flood warnings are in place nearby.'
      this.warningSeverity = severity.filter(item => { return item.id === 3 })[0]
    } else if (this.warnings[2] === 1) {
      this.warningMessage = 'A flood warning is in place nearby.'
      this.warningSeverity = severity.filter(item => { return item.id === 2 })[0]
    } else if (this.warnings[2] > 1) {
      this.warningMessage = 'Flood warnings are in place nearby.'
      this.warningSeverity = severity.filter(item => { return item.id === 2 })[0]
    } else if (this.warnings[1] === 1) {
      this.warningMessage = 'A flood alert is in place nearby.'
      this.warningSeverity = severity.filter(item => { return item.id === 1 })[0]
    } else if (this.warnings[1] > 1) {
      this.warningMessage = 'Flood alerts are in place nearby.'
      this.warningSeverity = severity.filter(item => { return item.id === 1 })[0]
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

module.exports = ImtdThresholds
