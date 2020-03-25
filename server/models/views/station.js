// const hoek = require('@hapi/hoek')
const moment = require('moment-timezone')
const config = require('../../config')
const Station = require('./station-data')
const Forecast = require('./station-forecast')

function dateDiff (date1, date2) {
  return moment(date1).diff(moment(date2), 'days')
}

class ViewModel {
  constructor (options) {
    const { station, telemetry, forecast, impacts, river } = options

    this.station = new Station(station)
    this.station.riverNavigation = river

    /*
    var levelType = this.station.isGroundwater ? 'Groundwater' : (this.station.isCoastal ? 'Sea' : 'River')

    Object.assign(this, {
      pageTitle: `${levelType} level at ${station.name}`
    })
    */

    this.id = this.station.id
    this.telemetry = telemetry || []
    this.catchments = []
    this.date = new Date()
    this.status = this.station.status
    this.outOfDate = dateDiff(Date.now(), this.station.statusDate) <= 5
    this.porMaxValueIsProvisional = false
    this.station.floodingIsPossible = false
    this.station.hasPercentiles = true
    this.station.hasImpacts = false
    const now = moment(Date.now())
    const numberOfProvisionalDays = config.provisionalPorMaxValueDays

    // Provisional por max date
    if (this.station.porMaxDate) {
      if (this.station.type === 's' || this.station.type === 'm' || this.station.type === 'g') {
        const diff = moment.duration(now.diff(this.station.porMaxDate))
        if (diff.asDays() < numberOfProvisionalDays) {
          this.station.porMaxValueIsProvisional = true
        }
        this.station.formattedPorMaxDate = moment(this.station.porMaxDate).format('DD/MM/YY')
      }
    }

    // Gets the latest value object
    if (this.telemetry.length) {
      this.readings = this.telemetry.length
      this.recentValue = this.telemetry[0]
      this.station.recentValue = this.recentValue
    }

    if (this.recentValue) {
      // Get most recent value time
      this.recentValue.formattedTime = moment(this.recentValue.ts).format('h:mma')
      var today = moment().startOf('day')
      var yesterday = moment().subtract(1, 'days').startOf('day')
      this.recentValue.dateWhen = 'on ' + moment(this.recentValue.ts).format('D/MM/YY')
      if (moment(this.recentValue.ts).isSame(today, 'd')) {
        this.recentValue.dateWhen = 'today'
      } else if (moment(this.recentValue.ts).isSame(yesterday, 'd')) {
        this.recentValue.dateWhen = 'yesterday'
      }

      // FFOI processing
      if (forecast) {
        const { thresholds } = forecast
        this.isFfoi = thresholds.length > 0
        if (this.isFfoi) {
          this.ffoi = new Forecast(forecast, this.station.isCoastal, this.station.recentValue)
          this.hasForecast = this.ffoi.hasForecastData
          this.alertThreshold = this.ffoi.alertThreshold || this.station.percentile5
          this.warningThreshold = this.ffoi.warningThreshold || null
        }
        this.phase = this.isFfoi ? 'beta' : false
      }

      // River level and forecast message
      this.atRiskFAL = this.alertThreshold &&
        ((this.recentValue && parseFloat(this.recentValue._)) >= parseFloat(this.alertThreshold) ||
        (this.hasForecast && this.ffoi.maxValue && parseFloat(this.ffoi.maxValue._) >= parseFloat(this.alertThreshold)))

      this.atRiskFW = this.warningThreshold &&
        ((this.recentValue && parseFloat(this.recentValue._)) >= parseFloat(this.warningThreshold) ||
        (this.hasForecast && this.ffoi.maxValue && parseFloat(this.ffoi.maxValue._) >= parseFloat(this.warningThreshold)))

      // Alerts and percentiles
      this.station.floodingIsPossible = this.atRiskFAL || this.atRiskFW

      if (this.station.percentile5 && this.station.percentile95) {
        if (!isNaN(this.station.percentile5) && !isNaN(this.station.percentile95)) {
          if (parseFloat(this.recentValue._) >= parseFloat(this.station.percentile5)) {
            this.station.floodingIsPossible = true
          }
        } else {
          this.station.hasPercentiles = false
        }
      } else {
        this.station.hasPercentiles = false
      }

      // Low/Med/High
      if (this.station.hasPercentiles) {
        if (this.station.type === 'c') {
          this.station.state = Math.round(this.station.recentValue._ * 10) / 10 + 'm'
        } else {
          if (parseFloat(this.station.recentValue._) > parseFloat(this.station.percentile5)) {
            this.station.state = 'High'
            this.station.stateInformation = 'above ' + this.station.percentile5 + 'm'
          } else if (parseFloat(this.station.recentValue._) < parseFloat(this.station.percentile95)) {
            this.station.state = 'Low'
            this.station.stateInformation = 'below ' + this.station.percentile5 + 'm'
          } else {
            this.station.state = 'Normal'
            this.station.stateInformation = this.station.percentile95 + 'm to ' + this.station.percentile5 + 'm typical'
          }
        }
      }
    }

    // Set Lat long
    const coordinates = JSON.parse(this.station.coordinates).coordinates
    coordinates.reverse()
    /*
    this.lat = coordinates[0]
    this.long = coordinates[1]
    this.warningsUrl = `/warnings?stationid=${this.id}`
    */

    // Set pageTitle, metaDescription and metaKeywords
    var stationType, stationLocation
    stationLocation = this.station.name
    if (this.station.type === 'c') {
      stationType = 'Sea'
    } else if (this.station.type === 'g') {
      stationType = 'Groundwater'
    } else {
      stationType = 'River'
    }

    if (this.station.type === 'g') {
      this.pageTitle = `Groundwater level at ${stationLocation}`
    } else if (this.station.type === 'c') {
      this.pageTitle = `Sea level at ${stationLocation}`
    } else {
      this.pageTitle = `${this.station.river} level ${this.station.isMulti ? this.station.direction + ' ' : ''}at ${stationLocation}`
    }
    this.metaDescription = `Check the latest recorded ${stationType.toLowerCase()} level${forecast ? ',' : ' and'} recent 5-day trend ${forecast ? ' and 36 hour forecast' : ''} at ${stationLocation}`
    this.metaKeywords = `${stationType} level, ${this.station.name}${this.station.isRiver ? ', ' + this.station.river : ''}${forecast ? ', forecast level' : ''}, flood risk, flood map, gov.uk`

    // Thresholds
    var thresholds = []
    if (this.station.recentValue && !this.station.recentValue.err) {
      thresholds.push({
        id: 'latest',
        value: this.station.recentValue._.toFixed(2),
        description: 'Latest level',
        shortname: '',
        type: 'latest',
        isExceeded: false
      })
    }
    if (this.station.porMaxValue) {
      thresholds.push({
        id: 'highest',
        value: this.station.porMaxValue,
        description: 'Highest level on record',
        shortname: 'Highest level on record',
        type: '',
        isExceeded: this.station.recentValue && !this.station.recentValue.err ? this.station.recentValue._ >= this.station.porMaxValue : false
      })
    }
    if (this.station.percentile5) { // Only push typical range if it has a percentil5
      thresholds.push({
        id: 'alert',
        value: this.station.percentile5,
        description: 'Top of typical range. Above this flooding to low-laying land is possible',
        shortname: 'Top of typical range',
        type: '',
        isExceeded: this.station.recentValue && !this.station.recentValue.err ? this.station.recentValue._ >= this.station.percentile5 : false
      })
    }
    if (this.warningThreshold) {
      thresholds.push({
        id: 'warning',
        value: this.warningThreshold,
        description: 'Flood warning may be issued',
        shortname: 'Flood warning possible',
        type: '',
        isExceeded: this.station.recentValue && !this.station.recentValue.err ? this.station.recentValue._ >= this.station.warningThreshold : false
      })
    }

    // Add impacts
    if (impacts.length > 0) {
      this.station.hasImpacts = true
    }

    if (impacts) {
      impacts.forEach(function (impact) {
        thresholds.push({
          id: impact.impactid,
          value: Number(impact.value).toFixed(2),
          description: impact.description,
          shortname: impact.shortname
        })
      })
    }

    // Group and sort thresholds
    thresholds = thresholds.reduce(
      (result, item) => ({
        ...result,
        [item.value]: [
          ...(result[item.value] || []),
          item
        ]
      }),
      {}
    )
    thresholds = Object.keys(thresholds).map(key => {
      return {
        level: key,
        values: thresholds[key]
      }
    })
    thresholds = thresholds.sort((a, b) => b.level - a.level)
    this.thresholds = thresholds

    // Set remaining station properties
    this.isUpstream = this.station.direction === 'upstream'
    this.isDownstream = this.station.direction === 'downstream'
    /*
    this.centroidJSON = JSON.stringify(coordinates)
    this.stationJSON = JSON.stringify(this.station)
    this.forecast = this.ffoi || {}
    this.forecastJSON = this.ffoi ? this.ffoi.forecastJSON : JSON.stringify({})
    */

    // Page category for feedback categorisation
    // this.pageCategory = this.isFfoi ? 'station-ffoi' : ''

    // Set canonical url
    this.metaCanonical = `/station/${this.station.id}${this.station.direction === 'upstream' ? '' : '/downstream'}`
  }
}

module.exports = ViewModel
