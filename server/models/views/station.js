const moment = require('moment-timezone')
const config = require('../../config')
const severity = require('../severity')
const Station = require('./station-data')
const Forecast = require('./station-forecast')
const util = require('../../util')
const tz = 'Europe/London'
const processImtdThresholds = require('./lib/process-imtd-thresholds')
const processThreshold = require('./lib/process-threshold')
const processWarningThresholds = require('./lib/process-warning-thresholds')
const filterImtdThresholds = require('./lib/find-min-threshold')

const bannerIconIdOne = 1
const bannerIconIdTwo = 2
const bannerIconIdThree = 3
const outOfDateMax = 5
const dataStartDateTimeDaysToSubtract = 5

const TOP_OF_NORMAL_RANGE = 'Top of normal range'

class ViewModel {
  constructor (options) {
    const { station, telemetry, forecast, imtdThresholds, impacts, river, warningsAlerts, requestUrl } = options

    this.station = new Station(station)
    this.station.riverNavigation = river
    this.id = station.id
    this.river = river
    const isForecast = forecast ? forecast.forecastFlag.display_time_series : false

    // Define station navigation properties based on the station type and qualifier
    const upstreamNavigationLink = createNavigationLink(river, 'upstream')
    const downstreamNavigationLink = createNavigationLink(river, 'downstream')

    this.navigationLink = { upstream: upstreamNavigationLink, downstream: downstreamNavigationLink }

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

    // Function to set banner state and icon
    if (numSevereWarnings) {
      setBannerState.call(this, { severe: true, warning: false, alert: false, iconId: bannerIconIdThree })
    } else if (numWarnings) {
      setBannerState.call(this, { severe: false, warning: true, alert: false, iconId: bannerIconIdTwo })
    } else if (numAlerts) {
      setBannerState.call(this, { severe: false, warning: false, alert: true, iconId: bannerIconIdOne })
    } else {
      setBannerState.call(this, { severe: false, warning: false, alert: false, iconId: null })
    }

    this.id = this.station.id
    this.telemetry = telemetry || []
    this.catchments = []
    this.date = new Date()
    this.status = this.station.status
    this.outOfDate = util.dateDiff(Date.now(), this.station.statusDate) <= outOfDateMax
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

      // check if recent value is over one hour old
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

    if (this.station.isGroundwater) {
      this.pageTitle = `Groundwater level at ${stationLocation}`
      this.postTitle = `Latest groundwater level information for ${this.station.name} borehole`
    } else if (this.station.isCoastal && this.river.river_name !== 'Sea Levels') {
      this.pageTitle = `${this.river.river_name} level at ${stationLocation}`
      this.postTitle = `Latest tidal level information for the ${this.river.river_name} at ${this.station.name}`
    } else if (this.station.isCoastal) {
      this.pageTitle = `Sea level at ${stationLocation}`
      this.postTitle = `Latest tidal level information for the sea at ${this.station.name}`
    } else {
      this.pageTitle = `${this.station.river} level ${this.station.isMulti ? this.station.direction + ' ' : ''}at ${stationLocation}`
      this.postTitle = `Latest river level information for the ${this.station.river} at ${this.station.name} ${this.station.isMulti ? this.station.direction : ''}`
    }
    this.metaDescription = `Check the latest recorded ${stationType.toLowerCase()} level and recent 5-day trend at ${stationLocation}`

    // Array to hold thresholds
    let thresholds = []

    // Check if recent value exists and add it to thresholds
    if (this.station.recentValue && !this.station.recentValue.err) {
      const tVal = this.station.type !== 'c' && this.station.recentValue._ <= 0 ? 0 : this.station.recentValue._.toFixed(2)
      thresholds.push({
        id: 'latest',
        value: tVal,
        description: 'Latest level',
        shortname: ''
      })
    }
    // Add the highest level threshold if available
    if (this.station.porMaxValue) {
      thresholds.push({
        id: 'highest',
        value: this.station.porMaxValue,
        description: this.station.thresholdPorMaxDate
          ? `Water reaches the highest level recorded at this measuring station (${this.station.thresholdPorMaxDate})`
          : 'Water reaches the highest level recorded at this measuring station',
        shortname: 'Highest level on record'
      })
    }

    if (imtdThresholds?.length > 0) {
      const processedWarningThresholds = processWarningThresholds(
        imtdThresholds,
        this.station.stageDatum,
        this.station.subtract,
        this.station.post_process)
      thresholds.push(...processedWarningThresholds)
    }

    this.imtdThresholds = imtdThresholds?.length > 0
      ? filterImtdThresholds(imtdThresholds)
      : []

    const processedImtdThresholds = processImtdThresholds(
      this.imtdThresholds,
      this.station.stageDatum,
      this.station.subtract,
      this.station.post_process,
      this.station.percentile5
    )
    thresholds.push(...processedImtdThresholds)

    // Handle chartThreshold: add tidThreshold if a valid tid is present; if not, fallback to 'pc5'; if 'pc5' is unavailable, use 'alertThreshold' with "Top of normal range" description.
    // Extract tid from request URL if valid
    let tid = null
    try {
      tid = requestUrl?.startsWith('http') ? new URL(requestUrl).searchParams.get('tid') : null
    } catch (e) {
      console.error('Invalid request URL:', e)
    }

    // Retrieve the applicable threshold for chartThreshold
    const chartThreshold = [getThresholdByThresholdId(tid, imtdThresholds, thresholds, this.station.stageDatum, this.station.subtract, this.station.post_process)].filter(Boolean)

    // Set chartThreshold property
    this.chartThreshold = chartThreshold

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
    if (isForecast) {
      this.isFfoi = isForecast
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
    let telemetryData
    if (telemetry.length) {
      telemetryData = telemetryForecastBuilder(this.telemetry, forecastData, this.station.type)
    }
    this.telemetryRefined = telemetryData || []
  }
}

function createNavigationLink (river, direction) {
  const {
    rloi_id: currentStationId,
    station_type: currentStationType,
    qualifier,
    isMulti,
    up,
    down,
    up_station_type: upStationType,
    down_station_type: downStationType
  } = river
  const currentStationQualifier = qualifier || (isMulti ? 'u' : null)
  const targetStationId = direction === 'upstream' ? up : down
  const targetStationType = direction === 'upstream' ? upStationType : downStationType

  if (targetStationId) {
    return determineNavigationLink(
      currentStationId,
      currentStationType,
      currentStationQualifier,
      targetStationType,
      targetStationId,
      direction
    )
  }

  return getQualifierSwitchLink(currentStationType, currentStationQualifier, currentStationId, direction)
}

function getQualifierSwitchLink (currentStationType, currentStationQualifier, currentStationId, direction) {
  if (
    currentStationType === 'M' &&
    ((direction === 'upstream' && currentStationQualifier === 'd') ||
      (direction === 'downstream' && currentStationQualifier === 'u'))
  ) {
    return direction === 'upstream' ? `${currentStationId}` : `${currentStationId}/downstream`
  }
  return null
}

function determineNavigationLink (
  currentStationId,
  currentStationType,
  currentStationQualifier,
  targetStationType,
  targetStationId,
  direction
) {
  // Handle switching between qualifiers within the same station
  if (currentStationType === 'M') {
    if (direction === 'upstream' && currentStationQualifier === 'd') {
      // From downstream to upstream within the same station
      return `${currentStationId}`
    } else if (direction === 'downstream' && currentStationQualifier === 'u') {
      // From upstream to downstream within the same station
      return `${currentStationId}/downstream`
    } else {
      // No qualifier switch needed; proceed to target station navigation
    }
  }

  // Upstream Navigation Logic
  if (direction === 'upstream') {
    if (targetStationType === 'M') {
      // Navigate to the downstream view of the multi-reading station
      return `${targetStationId}/downstream`
    } else {
      // Navigate to the single-reading station
      return `${targetStationId}`
    }
  } else if (direction === 'downstream') {
    // For downstream navigation, navigate to the target station ID
    return `${targetStationId}`
  } else {
    // Handle unexpected direction values
    return `${targetStationId}`
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

/**
 * Converts a moment object to ISO string format without milliseconds
 * @param {object} momentObj - Moment.js object
 * @returns {string} ISO string without milliseconds
 */
function toISOStringWithoutMilliseconds (momentObj) {
  return momentObj.toISOString().split('.')[0] + 'Z'
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
    dataStartDateTime: toISOStringWithoutMilliseconds(moment(telemetryRawData[0].ts).subtract(dataStartDateTimeDaysToSubtract, 'days')),
    dataEndDateTime: toISOStringWithoutMilliseconds(moment()),
    forecast: forecastData,
    observed
  }
}

function setBannerState ({ severe, warning, alert, iconId }) {
  this.isSevereLinkRenedered = severe
  this.isWarningLinkRendered = warning
  this.isAlertLinkRendered = alert
  this.mainIcon = getBannerIcon(iconId)
}

// Function to retrieve a threshold by tid or fall back to 'pc5' or 'alertThreshold'
const getThresholdByThresholdId = (tid, imtdThresholds, thresholds, stationStageDatum, stationSubtract, postProcess) => {
  // Check if a threshold exists based on tid
  const tidThreshold = tid && imtdThresholds?.find(thresh => thresh.station_threshold_id === tid)
  if (tidThreshold) {
    const thresholdValue = processThreshold(tidThreshold.value, stationStageDatum, stationSubtract, postProcess)
    return {
      id: tidThreshold.station_threshold_id,
      value: thresholdValue,
      description: `${tidThreshold.value}m ${tidThreshold.ta_name || ''}`,
      shortname: tidThreshold.ta_name || 'Target Area Threshold'
    }
  }

  // Fallback to 'pc5' if present, else look for 'alertThreshold'
  const pc5Threshold = thresholds.find(t => t.id === 'pc5')
  if (pc5Threshold) {
    return pc5Threshold
  }

  // Fallback to 'alertThreshold' if description includes 'Top of normal range'
  const alertThreshold = thresholds.find(t => t.id === 'alertThreshold' && t.description.includes(TOP_OF_NORMAL_RANGE))
  return alertThreshold ? { ...alertThreshold, shortname: TOP_OF_NORMAL_RANGE } : null
}

module.exports = ViewModel
