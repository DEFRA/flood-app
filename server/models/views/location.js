const severity = require('../severity')
const { groupBy } = require('../../util')
const { floodFisUrl, bingKeyMaps, floodRiskUrl } = require('../../config')
const moment = require('moment-timezone')

class ViewModel {
  constructor ({ location, place, floods, stations, impacts, matrixData, outOfDate, dataError, outlookDays, outlookData, outlookContent, issuedAt }) {
    const title = place.name

    // Constants for repeated literals
    const TIMEZONE = 'Europe/London'
    const TIME_FORMAT = 'h:mma'
    const DATE_FORMAT = 'D MMMM YYYY'

    Object.assign(this, {
      q: location,
      place,
      placeBbox: place ? place.bbox2k : [],
      floods,
      impacts,
      floodRiskUrl,
      matrixData,
      outOfDate,
      outlookContent,
      pageTitle: `Check for flooding in ${title}`,
      metaDescription: `View current flood warnings and alerts for the ${title} area, and the regional flood forecast for the next 5 days. Also check local river, sea, groundwater and rainfall levels.`,
      floodFisUrl,
      dateFormatted: `Up to date as of ${moment.tz(TIMEZONE).format(TIME_FORMAT)} on ${moment.tz(TIMEZONE).format(DATE_FORMAT)}`,
      feedback: false,
      dataError,
      signUpForFloodWarnings: 'Location:Get warnings:Location - Get warnings',
      planAhead: 'Location:Related-content:Plan-ahead-for-flooding',
      whatToDo: 'Location:Related-content:What-to-do-in-a-flood',
      recoverAfter: 'Location:Related-content:Recover-after-a-flood',
      reportFlood: 'Location:Related-content:Report-a-flood',
      displayGetWarningsLink: 'Location:Related-content:Get-warnings'
    })

    const hasFloods = !!floods.length

    if (hasFloods) {
      this.groupAndOrder(floods, hasFloods, location)
    }

    // Count stations that are 'high'
    this.processStations(stations)

    // River and sea levels
    this.hasLevels = !!stations.length
    this.levels = groupBy(stations, 'wiski_river_name')

    // Impacts
    this.processImpacts(impacts)

    // Outlook issue date/time for display
    this.outlookIssue = {
      issueUTC: issuedAt ? moment(issuedAt).tz(TIMEZONE).format() : moment().tz(TIMEZONE).format(),
      formattedIssueDate: issuedAt ? `${moment(issuedAt).tz(TIMEZONE).format(TIME_FORMAT)} on ${moment(issuedAt).tz(TIMEZONE).format(DATE_FORMAT)}` : `${moment().tz(TIMEZONE).format(TIME_FORMAT)} on ${moment().tz(TIMEZONE).format(DATE_FORMAT)}`
    }

    this.outlookAllLow = outlookContent?.[0]?.sentences?.[0] === 'The flood risk is very low.'

    // Expose model values for client side javascript
    this.expose = {
      hasWarnings: this.hasActiveFloods,
      mapButtonText: this.hasActiveFloods ? 'View map of flood warnings and alerts' : 'View map',
      placeBbox: this.placeBbox,
      bingMaps: bingKeyMaps,
      outlookDays: outlookDays || [],
      outlookData: outlookData || null,
      outlookContent: outlookContent || ''
    }
  }

  groupAndOrder (floods, hasFloods, location) {
    const activeFloods = floods.filter(flood => flood.severity_value < 4)
    const inactiveFloods = floods.filter(flood => flood.severity_value === 4)
    const severeWarnings = floods.filter(flood => flood.severity_value === 3)
    const warnings = floods.filter(flood => flood.severity_value === 2)

    this.hasFloods = hasFloods
    this.hasActiveFloods = !!activeFloods.length
    this.hasInactiveFloods = !!inactiveFloods.length

    // Group and order floods by most severe
    const grouped = groupBy(floods, 'severity_value')
    const groups = severity.map(item => {
      return {
        severity: item, floods: grouped[item.id]
      }
    }).filter(item => {
      return !!item.floods // filters out any without a floods array
    })

    groups.forEach((group, i) => {
      switch (group.severity.hash) {
        case 'severe':
          this.groupSevere(group, location)
          break
        case 'warning':
          this.groupWarning(group, location)
          break
        case 'alert':
          this.groupAlert(warnings, severeWarnings, group, location)
          break
        case 'removed':
          this.groupRemoved(group, location)
          break
      }
    })
  }

  groupSevere (group, location) {
    this.bannerSevereSub = 'There is a danger to life'
    this.severitySevereTitle = group.severity.title
    this.severeIcon = group.severity.icon
    if (group.floods.length === 1) {
      this.bannerSevereMainLink = `/target-area/${group.floods[0].ta_code}`
      this.bannerSevereMainText = `Severe flood warning for ${group.floods[0].ta_name}`
    } else {
      this.bannerSevereMainLink = `/alerts-and-warnings?q=${encodeURIComponent(location)}#severe`
      this.bannerSevereMainText = `${group.floods.length} severe flood warnings in this area`
    }
  }

  groupWarning (group, location) {
    this.bannerSub = 'Flooding is expected'
    this.severity = group.severity.hash
    this.severityTitle = group.severity.title
    this.mainIcon = group.severity.icon
    if (group.floods.length === 1) {
      this.bannerMainLink = `/target-area/${group.floods[0].ta_code}`
      this.bannerMainText = `Flood warning for ${group.floods[0].ta_name}`
    } else {
      this.bannerMainLink = `/alerts-and-warnings?q=${encodeURIComponent(location)}#warnings`
      this.bannerMainText = `${group.floods.length} flood warnings in this area`
    }
  }

  groupAlert (warnings, severeWarnings, group, location) {
    if (!warnings.length && !severeWarnings.length) {
      this.bannerSub = 'Some flooding is possible'
      this.severity = group.severity.hash
      this.severityTitle = group.severity.title
      if (group.floods.length === 1) {
        this.bannerMainLink = `/target-area/${group.floods[0].ta_code}`
        this.bannerMainText = 'There is a flood alert in this area'
      } else {
        this.bannerMainLink = `/alerts-and-warnings?q=${encodeURIComponent(location)}#alerts`
        this.bannerMainText = `${group.floods.length} flood alerts in this area`
      }
      this.mainIcon = group.severity.icon
    } else {
      this.alerts = group.floods.length
      if (group.floods.length === 1) {
        this.alertsSummaryLink = `/target-area/${group.floods[0].ta_code}`
        this.alertsSummaryLinkText = '1 flood alert'
        this.alertsSummaryText = 'is'
      } else {
        this.alertsSummaryLink = `/alerts-and-warnings?q=${encodeURIComponent(location)}#alerts`
        this.alertsSummaryLinkText = `${group.floods.length} flood alerts`
        this.alertsSummaryText = 'are'
      }
    }
  }

  groupRemoved (group, location) {
    this.removed = group.floods.length
    if (group.floods.length === 1) {
      this.removedLink = `/target-area/${group.floods[0].ta_code}`
      this.removedLinkText = '1 flood alert or warning was removed '
      this.removedText = 'in the last 24 hours.'
    } else {
      this.removedLink = `/alerts-and-warnings?q=${encodeURIComponent(location)}#removed`
      this.removedLinkText = 'Flood alerts and warnings were removed'
      this.removedText = 'in the last 24 hours.'
    }
  }

  processStations (stations) {
    let hasHighLevels = false
    for (const s in stations) {
      if (
        stations[s].station_type !== 'C' && stations[s].station_type !== 'G' && stations[s].value && stations[s].status.toLowerCase() === 'active' &&
        parseFloat(stations[s].value) > parseFloat(stations[s].percentile_5)
      ) {
        hasHighLevels = true
      }
    }
    this.hasHighLevels = hasHighLevels
  }

  processImpacts (impacts) {
    // sort impacts order by value
    impacts.sort((a, b) => b.value - a.value)
    // create an array of all active impacts
    this.activeImpacts = impacts.filter(active => active.telemetryactive === true)
    this.hasActiveImpacts = !!this.activeImpacts.length
  }
}

module.exports = ViewModel
