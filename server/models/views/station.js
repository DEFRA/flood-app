// const hoek = require('@hapi/hoek')
const moment = require('moment-timezone')
const config = require('../../config')
const Station = require('./station-data')
const Forecast = require('./station-forecast')
const util = require('../../util')

class ViewModel {
  constructor (options) {
    const { station, telemetry, forecast, imtdThresholds, impacts, river, warningsAlerts } = options

    this.station = new Station(station)
    this.station.riverNavigation = river

    this.twitterEvent = 'Station:Share Page:Station - Share to Twitter'
    this.facebookEvent = 'Station:Share Page:Station - Share to Facebook'
    this.emailEvent = 'Station:Share Page:Station - Share to email'

    Object.assign(this, {
      feedback: false,
      bingMaps: config.bingKeyMaps
    })
    // Group warnings/alerts by severity level

    const warningsAlertsGroups = util.groupBy(warningsAlerts, 'severity_value')
    const numAlerts = warningsAlertsGroups['1'] ? warningsAlertsGroups['1'].length : 0
    const numWarnings = warningsAlertsGroups['2'] ? warningsAlertsGroups['2'].length : 0
    const numSevereWarnings = warningsAlertsGroups['3'] ? warningsAlertsGroups['3'].length : 0

    // Determine appropriate warning/alert text for banner

    this.banner = numAlerts || numWarnings || numSevereWarnings

    switch (numAlerts) {
      case 0:
        break
      case 1:
        if (!numWarnings && !numSevereWarnings) {
          this.severityLevel = 'alert'
          this.alertsBanner = 'There is a flood alert within 5 miles of this measuring station'
          this.alertsLink = `/target-area/${warningsAlertsGroups['1'][0].ta_code}`
        }
        this.isAlertLinkRendered = true
        break
      default: {
        this.severityLevel = 'alert'
        this.alertsBanner = 'There are flood alerts within 5 miles of this measuring station'
        this.alertsLink = `/alerts-and-warnings?station=${this.station.id}#alerts`
        this.isAlertLinkRendered = true
      }
    }

    switch (numWarnings) {
      case 0:
        break
      case 1:
        if (!numAlerts && !numSevereWarnings) {
          this.severityLevel = 'warning'
          this.warningsBanner = `Flood warning for ${warningsAlertsGroups['2'][0].ta_name}`
          this.warningsLink = `/target-area/${warningsAlertsGroups['2'][0].ta_code}`
        } else {
          this.severityLevel = 'warning'
          this.warningsBanner = 'There is a flood warning within 5 miles of this measuring station'
          this.warningsLink = `/alerts-and-warnings?station=${this.station.id}#warnings`
        }
        this.isWarningLinkRendered = true
        break
      default: {
        this.severityLevel = 'warning'
        this.warningsBanner = 'There are flood warnings within 5 miles of this measuring station'
        this.warningsLink = `/alerts-and-warnings?station=${this.station.id}#warnings`
        this.isWarningLinkRendered = true
      }
    }

    switch (numSevereWarnings) {
      case 0:
        break
      case 1:
        if (!numAlerts && !numWarnings) {
          this.severityLevel = 'severe'
          this.severeBanner = `Severe flood warning for ${warningsAlertsGroups['3'][0].ta_name}`
          this.severeLink = `/target-area/${warningsAlertsGroups['3'][0].ta_code}`
        } else {
          this.severityLevel = 'severe'
          this.severeBanner = 'There is a severe flood warning within 5 miles of this measuring station'
          this.severeLink = `/alerts-and-warnings?station=${this.station.id}#severe`
        }
        this.isSevereLinkRenedered = true
        break
      default: {
        this.severityLevel = 'severe'
        this.severeBanner = 'There are severe flood warnings within 5 miles of this measuring station'
        this.severeLink = `/alerts-and-warnings?station=${this.station.id}#severe`
        this.isSevereLinkRenedered = true
      }
    }

    if (numSevereWarnings && (numWarnings || numAlerts)) {
      this.isSevereLinkRenedered = true
      this.isWarningLinkRendered = false
      this.isAlertLinkRendered = false
    } else if (numWarnings && numAlerts) {
      this.isWarningLinkRendered = true
      this.isAlertLinkRendered = false
    } else {
      this.isAlertLinkRendered = true
    }
    this.id = this.station.id
    this.telemetry = telemetry || []
    this.catchments = []
    this.date = new Date()
    this.status = this.station.status
    this.outOfDate = util.dateDiff(Date.now(), this.station.statusDate) <= 5
    this.porMaxValueIsProvisional = false
    this.station.floodingIsPossible = false
    this.station.hasPercentiles = true
    this.station.hasImpacts = false
    this.warningsAlerts = warningsAlertsGroups
    const now = moment(Date.now())
    const numberOfProvisionalDays = config.provisionalPorMaxValueDays

    // Provisional por max date
    if (this.station.porMaxDate) {
      if (this.station.type === 's' || this.station.type === 'm' || this.station.type === 'g') {
        const diff = moment.duration(now.diff(this.station.porMaxDate))
        if (diff.asDays() < numberOfProvisionalDays) {
          this.station.porMaxValueIsProvisional = true
        }
        this.station.formattedPorMaxDate = moment.tz(this.station.porMaxDate, 'Europe/London').format('DD/MM/YY')
        this.station.thresholdPorMaxDate = moment.tz(this.station.porMaxDate, 'Europe/London').format('D MMMM YYYY')
      }
    }

    // formatted Status Date and time
    this.station.formattedStatusDate = moment.tz(this.station.statusDate, 'Europe/London').format('dddd D MMMM YYYY')
    this.station.formattedStatusTime = moment.tz(this.station.statusDate, 'Europe/London').format('h:ma')

    // Gets the latest value object
    if (this.telemetry.length) {
      this.telemetry = util.removeSpikes(this.telemetry)
      this.readings = this.telemetry.length
      this.recentValue = this.telemetry[0]
      this.recentValueBelowZero = this.recentValue._ <= 0
      this.station.recentValue = this.recentValue
      this.hasNegativeValues = this.telemetry.some(t => t._ <= 0)
    }

    if (this.recentValue) {
      // Get most recent value time
      this.recentValue.formattedTime = moment.tz(this.recentValue.ts, 'Europe/London').format('h:mma')
      const today = moment().startOf('day')
      const yesterday = moment().subtract(1, 'days').startOf('day')

      const oneHourAgo = new Date()

      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      // check if recent value is over one hour old
      this.dataOverHourOld = new Date(this.recentValue.ts) < oneHourAgo

      this.recentValue.dateWhen = 'on ' + moment.tz(this.recentValue.ts, 'Europe/London').format('D/MM/YY')
      if (moment.tz(this.recentValue.ts, 'Europe/London').isSame(today, 'd')) {
        this.recentValue.dateWhen = 'today'
      } else if (moment.tz(this.recentValue.ts, 'Europe/London').isSame(yesterday, 'd')) {
        this.recentValue.dateWhen = 'yesterday'
      }

      // FFOI processing
      if (forecast) {
        const { thresholds } = forecast

        this.isFfoi = thresholds.length > 0
        if (this.isFfoi) {
          this.ffoi = new Forecast(forecast, this.station.isCoastal, this.station.recentValue)
          this.hasForecast = this.ffoi.hasForecastData

          const highestPoint = this.ffoi.maxValue || null
          if (highestPoint !== null) {
            const forecastHighestPoint = parseFloat(highestPoint._).toFixed(2)
            const forecastHighestPointTime = highestPoint.formattedTimestamp

            this.forecastDetails = `The highest level in our forecast is ${forecastHighestPoint}m at ${forecastHighestPointTime}. Forecasts come from a computer model and can change.`
          }
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
            this.station.stateInformation = 'below ' + this.station.percentile95 + 'm'
          } else {
            this.station.state = 'Normal'
            this.station.stateInformation = this.station.percentile95 + 'm to ' + this.station.percentile5 + 'm'
          }
        }
      }
    }

    // Set Lat long
    const coordinates = JSON.parse(this.station.coordinates).coordinates
    coordinates.reverse()

    // Set pageTitle, metaDescription
    let stationType
    const stationLocation = this.station.name
    if (this.station.type === 'c') {
      stationType = 'Sea'
    } else if (this.station.type === 'g') {
      stationType = 'Groundwater'
    } else {
      stationType = 'River'
    }

    if (this.station.type === 'g') {
      this.pageTitle = `Groundwater level at ${stationLocation}`
      this.postTitle = `Latest groundwater level information for ${this.station.name} borehole`
    } else if (this.station.type === 'c') {
      this.pageTitle = `Sea level at ${stationLocation}`
      this.postTitle = `Latest tidal level information for the ${this.station.river} at ${this.station.name}`
    } else {
      this.pageTitle = `${this.station.river} level ${this.station.isMulti ? this.station.direction + ' ' : ''}at ${stationLocation}`
      this.postTitle = `Latest river level information for the ${this.station.river} at ${this.station.name} ${this.station.isMulti ? this.station.direction : ''}`
    }
    this.metaDescription = `Check the latest recorded ${stationType.toLowerCase()} level and recent 5-day trend at ${stationLocation}`

    // Thresholds
    let thresholds = []

    if (this.station.recentValue && !this.station.recentValue.err) {
      thresholds.push({
        id: 'latest',
        value: this.station.recentValue._.toFixed(2),
        description: 'Latest level',
        shortname: ''
      })
    }
    if (this.station.porMaxValue) {
      thresholds.push({
        id: 'highest',
        value: this.station.porMaxValue,
        description: this.station.thresholdPorMaxDate
          ? 'Water reaches the highest level recorded at this measuring station (recorded on ' + this.station.thresholdPorMaxDate + ')'
          : 'Water reaches the highest level recorded at this measuring station',
        shortname: 'Highest level on record'
      })
    }

    const stationStageDatum = this.station.stageDatum
    const stationSubtract = this.station.subtract

    let imtdThreshold1 = imtdThresholds.thresholdsImtd[1]

    if (imtdThreshold1 !== null) {
      if (this.station.post_process) {
        if (stationStageDatum > 0) {
          imtdThreshold1 = imtdThreshold1 - stationStageDatum
        } else if (stationStageDatum <= 0 && stationSubtract > 0) {
          imtdThreshold1 = imtdThreshold1 - stationSubtract
        }
      }
      this.alertThreshold = parseFloat(imtdThreshold1).toFixed(2)
      thresholds.push({
        id: 'alertThreshold',
        value: this.alertThreshold,
        valueImtd: imtdThreshold1 || 'n/a',
        description: 'Low lying land flooding is possible above this level. One or more flood alerts may be issued',
        shortname: 'Possible flood alerts'
      })
    }

    let imtdThreshold0 = imtdThresholds.thresholdsImtd[0]

    if (imtdThreshold0 !== null) {
      // Correct threshold value if value > zero (Above Ordnance Datum) [FSR-595]
      if (this.station.post_process) {
        if (stationStageDatum > 0) {
          imtdThreshold0 = imtdThreshold0 - stationStageDatum
        } else if (stationStageDatum <= 0 && stationSubtract > 0) {
          imtdThreshold0 = imtdThreshold0 - stationSubtract
        }
      }

      this.warningThreshold = parseFloat(imtdThreshold0).toFixed(2)
      thresholds.push({
        id: 'warningThreshold',
        value: this.warningThreshold,
        valueImtd: imtdThreshold0 || 'n/a',
        description: 'Property flooding is possible above this level. One or more flood warnings may be issued',
        shortname: 'Possible flood warnings'
      })
    }

    if (this.station.percentile5) {
      // Only push typical range if it has a percentil5
      thresholds.push({
        id: 'pc5',
        value: this.station.percentile5,
        description: 'This is the top of the normal range',
        shortname: 'Top of normal range'
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
          description: `Historical event: ${impact.description}`,
          shortname: impact.shortname,
          type: 'historical'
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
        values: thresholds[key],
        isLatest: thresholds[key][0].id === 'latest',
        type: thresholds[key][0].type || '',
        isExceeded: this.station.recentValue && !this.station.recentValue.err && this.station.recentValue._ >= key
      }
    })
    thresholds = thresholds.sort((a, b) => b.level - a.level)
    this.thresholds = thresholds

    // Set remaining station properties
    this.isUpstream = this.station.direction === 'upstream'
    this.isDownstream = this.station.direction === 'downstream'

    // Set canonical url
    this.metaCanonical = `/station/${this.station.id}${this.station.direction === 'upstream' ? '' : '/downstream'}`
    this.liveServiceUrl = `/station/${this.station.id}${this.station.direction === 'downstream' ? '?direction=d' : ''}`
  }
}

module.exports = ViewModel
