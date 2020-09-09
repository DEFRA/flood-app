const severity = require('../severity')
const { groupBy } = require('../../util')
const { floodRiskUrl } = require('../../config')
const moment = require('moment-timezone')

class ViewModel {
  constructor ({ location, place, floods, stations, impacts }) {
    const title = place.name

    Object.assign(this, {
      q: location,
      place,
      placeBbox: place ? place.bbox : [],
      floods,
      impacts,
      location: title,
      pageTitle: `Check for flooding in ${title}`,
      metaDescription: `Nearby flood alerts and warnings; latest river and sea levels and flood risk advice for residents living in the ${title} area.`,
      floodRiskUrl,
      dateFormatted: 'Up to date as of ' + moment.tz('Europe/London').format('h:mma') + ' on ' + moment.tz('Europe/London').format('D MMMM YYYY'),
      feedback: true
    })

    const hasFloods = !!floods.length

    // Floods
    if (hasFloods) {
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
          severity: item,
          floods: grouped[item.id]
        }
      }).filter(item => {
        return !!item.floods // filters out any without a floods array
      })

      groups.forEach((group, i) => {
        switch (group.severity.hash) {
          case 'severe':
            this.bannerSevereSub = 'There is a danger to life'
            this.severitySevereTitle = group.severity.title
            if (group.floods.length === 1) {
              this.bannerSevereMainLink = `/target-area/${group.floods[0].ta_code}`
              this.bannerSevereMainText = `Severe flood warning for ${group.floods[0].ta_name}`
            } else {
              this.bannerSevereMainLink = `/alerts-and-warnings?q=${location}#severe`
              this.bannerSevereMainText = `${group.floods.length} severe flood warnings in this area`
            }
            break
          case 'warning':
            this.bannerSub = 'Flooding is expected'
            this.severity = group.severity.hash
            this.severityTitle = group.severity.title
            if (group.floods.length === 1) {
              this.bannerMainLink = `/target-area/${group.floods[0].ta_code}`
              this.bannerMainText = `Flood warning for ${group.floods[0].ta_name}`
            } else {
              this.bannerMainLink = `/alerts-and-warnings?q=${location}#warnings`
              this.bannerMainText = `${group.floods.length} flood warnings in this area`
            }
            break
          case 'alert':
            if (!warnings.length && !severeWarnings.length) {
              this.bannerSub = 'Some flooding is possible'
              this.severity = group.severity.hash
              this.severityTitle = group.severity.title
              if (group.floods.length === 1) {
                this.bannerMainLink = `/target-area/${group.floods[0].ta_code}`
                this.bannerMainText = 'There is a flood alert in this area'
              } else {
                this.bannerMainLink = `/alerts-and-warnings?q=${location}#alerts`
                this.bannerMainText = `${group.floods.length} flood alerts in this area`
              }
            } else {
              this.alerts = group.floods.length
              if (group.floods.length === 1) {
                this.alertsSummaryLink = `/target-area/${group.floods[0].ta_code}`
                this.alertsSummaryLinkText = '1 flood alert'
                this.alertsSummaryText = 'is'
              } else {
                this.alertsSummaryLink = `/alerts-and-warnings?q=${location}#alerts`
                this.alertsSummaryLinkText = `${group.floods.length} flood alerts`
                this.alertsSummaryText = 'are'
              }
            }
            break
          case 'removed':
            this.removed = group.floods.length
            if (group.floods.length === 1) {
              this.removedLink = `/target-area/${group.floods[0].ta_code}`
              this.removedLinkText = '1 flood alert or warning was removed '
              this.removedText = 'in the last 24 hours.'
            } else {
              this.removedLink = `/alerts-and-warnings?q=${location}#removed`
              this.removedLinkText = 'Flood alerts and warnings were removed'
              this.removedText = 'in the last 24 hours'
            }
            break
        }
      })
    }

    // Count stations that are 'high'
    let hasHighLevels = false
    for (const s in stations) {
      if (stations[s].station_type !== 'C' && stations[s].station_type !== 'G' && stations[s].value) {
        if (stations[s].value > stations[s].percentile_5) {
          hasHighLevels = true
        }
      }
    }
    this.hasHighLevels = hasHighLevels

    // River and sea levels
    this.hasLevels = !!stations.length
    this.levels = groupBy(stations, 'wiski_river_name')

    // Impacts
    // sort impacts order by value
    impacts.sort((a, b) => b.value - a.value)
    // create an array of all active impacts
    this.activeImpacts = impacts.filter(active => active.telemetryactive === true)
    this.hasActiveImpacts = !!this.activeImpacts.length
    this.expose = {
      placeBbox: this.placeBbox
    }
  }
}

module.exports = ViewModel
