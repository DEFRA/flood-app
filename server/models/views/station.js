const moment = require('moment-timezone')
const config = require('../../config')
const severity = require('../severity')
const Station = require('./station-data')
const Forecast = require('./station-forecast')
const util = require('../../util')
const tz = 'Europe/London'
const processImtdThresholds = require('./lib/process-imtd-thresholds')
const filterImtdThresholds = require('./lib/find-min-threshold')

class ViewModel {
  constructor (options) {
    const { station, telemetry, forecast, imtdThresholds, impacts, river, warningsAlerts } = options

    this.station = new Station(station)
    this.station.riverNavigation = river
    this.id = station.id

    this.station.trend = river.trend

    Object.assign(this, {
      feedback: false,
      bingMaps: config.bingKeyMaps,
      displayGetWarningsLink: true,
      displayLongTermLink: true,
      floodRiskUrl: config.floodRiskUrl,
      trend: river.trend
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
      this.mainIcon = getBannerIcon(3)
    } else if (numWarnings && numAlerts) {
      this.isWarningLinkRendered = true
      this.isAlertLinkRendered = false
      this.mainIcon = getBannerIcon(2)
    } else {
      this.isAlertLinkRendered = true
      this.mainIcon = getBannerIcon(1)
    }
    this.id = this.station.id
    this.telemetry = telemetry || []
    this.catchments = []
    this.date = new Date()
    this.status = this.station.status
    this.outOfDate = util.dateDiff(Date.now(), this.station.statusDate) <= 5
    this.porMaxValueIsProvisional = false
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
        this.station.formattedPorMaxDate = moment.tz(this.station.porMaxDate, tz).format('DD/MM/YY')
        this.station.thresholdPorMaxDate = moment.tz(this.station.porMaxDate, tz).format('D MMMM YYYY')
      }
    }

    // formatted Status Date and time
    this.station.formattedStatusDate = moment.tz(this.station.statusDate, tz).format('dddd D MMMM YYYY')
    this.station.formattedStatusTime = moment.tz(this.station.statusDate, tz).format('h:ma')

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
      this.recentValue.formattedTime = moment.tz(this.recentValue.ts, tz).format('h:mma')
      this.recentValue.latestDayFormatted = moment.tz(this.recentValue.ts, tz).format('D MMMM')

      const today = moment().startOf('day')
      const yesterday = moment().subtract(1, 'days').startOf('day')

      const oneHourAgo = new Date()

      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      // check if recent value is over one hour old0
      this.dataOverHourOld = new Date(this.recentValue.ts) < oneHourAgo

      this.recentValue.dateWhen = 'on ' + moment.tz(this.recentValue.ts, tz).format('D/MM/YY')
      if (moment.tz(this.recentValue.ts, tz).isSame(today, 'd')) {
        this.recentValue.dateWhen = 'today'
      } else if (moment.tz(this.recentValue.ts, tz).isSame(yesterday, 'd')) {
        this.recentValue.dateWhen = 'yesterday'
      } else {
        this.recentValue.dateWhen = ''
      }

      if (this.station.percentile5 && this.station.percentile95) {
        if (isNaN(this.station.percentile5) || isNaN(this.station.percentile95)) {
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
          this.station.stateInformation = this.station.percentile95 + 'm to ' + this.station.percentile5 + 'm'
          if (parseFloat(this.station.recentValue._) > parseFloat(this.station.percentile5)) {
            this.station.state = 'High'
          } else if (parseFloat(this.station.recentValue._) < parseFloat(this.station.percentile95)) {
            this.station.state = 'Low'
          } else {
            this.station.state = 'Normal'
          }
        }
      }
    }

    // // Set Lat long
    const coordinates = JSON.parse(this.station.coordinates).coordinates

    this.centre = coordinates.join(',')

    // Set pageTitle, metaDescription
    const stationType = stationTypeCalculator(this.station.type)
    const stationLocation = this.station.name

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
      const tVal = this.station.type !== 'c' && this.station.recentValue._ <= 0 ? 0 : this.station.recentValue._.toFixed(2)

      thresholds.push({
        id: 'latest',
        value: tVal,
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

    this.imtdThresholds = imtdThresholds?.length > 0
      ? filterImtdThresholds(imtdThresholds)
      : []

    const processedImtdThresholds = processImtdThresholds(
      this.imtdThresholds,
      this.station.stageDatum,
      this.station.subtract,
      this.station.post_process
    )

    thresholds.push(...processedImtdThresholds)

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

    if (this.station.type === 'c' && river.river_id !== 'Sea Levels') {
      this.station.isTidal = true
    }

    // Toggletips
    if ((this.station.type === 's') || (this.station.type === 'm') || (this.station.type === 'g') || (this.station.isTidal)) {
      this.infoHeight = (() => {
        if (Number(station.stage_datum) === 0) {
          return 'This station measures height from sea level.'
        } else if (this.recentValueBelowZero) {
          return 'This station measures height from a fixed point on or close to the riverbed.' +
          ' A reading of 0 metres can be normal for some stations because of natural changes to the riverbed.'
        } else {
          return `This station measures height from a fixed point on or close to the riverbed. This point is ${this.station.stageDatum}m above sea level.`
        }
      })()
      this.infoState = (() => {
        let state
        switch (this.station.state) {
          case 'High':
            state = 'above'
            break
          case 'Low':
            state = 'below'
            break
          default:
            state = 'within'
        }
        return `There are 3 states: low, normal and high. The latest level is ${state} the normal range. ` +
        'We calculate the normal range using an average of past measurements and other local factors.'
      })()
    }
    this.infoTrend = 'The trend is based on the last 5 readings.'

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

    // Map
    this.zoom = 14

    // Forecast Data Calculations

    let forecastData
    if (forecast) {
      const { thresholds } = forecast
      this.isFfoi = thresholds.length > 0
      if (this.isFfoi) {
        forecastData = new Forecast(forecast, this.station.isCoastal, this.station.recentValue)
        this.isForecast = forecastData.hasForecastData
        const highestPoint = forecastData.maxValue || null

        if (highestPoint !== null) {
          const forecastHighestPoint = parseFloat(highestPoint._).toFixed(2)
          const forecastHighestPointTime = `${moment.tz(highestPoint.ts, tz).format('D MMMM')} at ${moment.tz(highestPoint.ts, tz).format('h:mma')}`

          this.forecastHighest = forecastHighestPoint
          this.forecastHighestTime = forecastHighestPointTime
          this.forecastDetails = `The highest level in our forecast is ${forecastHighestPoint}m at ${forecastHighestPointTime}. Forecasts come from a computer model and can change.`
        }
      }
    }
    let telemetryData
    if (telemetry.length) {
      telemetryData = telemetryForecastBuilder(this.telemetry, forecastData, this.station.type)
    }
    this.telemetryRefined = telemetryData || []
  }
}

function getBannerIcon (id) {
  return severity.find(item => item.id === id)?.icon
}

function stationTypeCalculator (stationTypeData) {
  let stationType
  if (stationTypeData === 'c') {
    stationType = 'Sea'
  } else if (stationTypeData === 'g') {
    stationType = 'Groundwater'
  } else {
    stationType = 'River'
  }
  return stationType
}
function telemetryForecastBuilder (telemetryRawData, forecastRawData, stationType) {
  const observed = telemetryRawData
    .filter(telemetry => telemetry._ !== null) // Filter out records where telemetry._ is null
    .map(telemetry => ({
      dateTime: telemetry.ts,
      value: telemetry._
    }))

  let forecastData = []

  if (forecastRawData) {
    forecastData = forecastRawData.processedValues.map(function (forecast) {
      return {
        dateTime: forecast.ts,
        value: Number(forecast._)
      }
    })
  }

  return {
    type: stationTypeCalculator(stationType).toLowerCase(),
    latestDateTime: telemetryRawData[0].ts,
    dataStartDateTime: moment(telemetryRawData[0].ts).subtract(5, 'days').toISOString().replace(/.\d+Z$/g, 'Z'),
    dataEndDateTime: moment().toISOString().replace(/.\d+Z$/g, 'Z'),
    forecast: forecastData,
    observed
  }
}

module.exports = ViewModel
