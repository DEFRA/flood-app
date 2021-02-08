const severity = require('../severity')
const { groupBy } = require('../../util')
const { floodFisUrl, bingKeyMaps } = require('../../config')
const moment = require('moment-timezone')

class ViewModel {
  constructor ({ location, place, floods, stations, impacts, tabs }) {
    const title = place.name

    Object.assign(this, {
      q: location,
      place,
      placeBbox: place ? place.bbox2k : [],
      floods,
      impacts,
      tabs,
      location: title,
      pageTitle: `Check for flooding in ${title}`,
      metaDescription: `Nearby flood alerts and warnings; latest river and sea levels and flood risk advice for residents living in the ${title} area.`,
      floodFisUrl,
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
              this.removedText = 'in the last 24 hours.'
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
      placeBbox: this.placeBbox,
      bingMaps: bingKeyMaps
    }

    // Outlook tabs

    // Sort array

    const fullArray = this.tabs.polys

    if (fullArray) {
      fullArray.sort((a, b) => {
        if (a.day === b.day) {
          if (a.source === b.source) {
            return (a.messageId > b.messageId) ? -1 : (a.messageId < b.messageId) ? 1 : 0
          } else {
            return (a.source < b.source) ? -1 : 1
          }
        } else {
          return (a.day < b.day) ? -1 : 1
        }
      })

      // Group by day

      this.groupByDay = groupBy(fullArray, 'day')

      this.groupByDayFull = groupBy(fullArray, 'day')

      // Find distinct messages for each source for each day

      for (const [day, messages] of Object.entries(this.groupByDay)) {
        const uniqueArray = []
        const mapMessages = new Map()
        for (const item of messages) {
          if (!mapMessages.has(item.source)) {
            mapMessages.set(item.source, true) // set any value to Map
            uniqueArray.push({
              day: item.day,
              source: item.source,
              messageId: item.messageId,
              polyId: item.polyId
            })
          }
        }

        this.groupByDay[day] = uniqueArray
      }

      // Combine sources with same messageId

      if (this.groupByDay['1']) {
        const arrayObj = this.groupByDay['1'].reduce((map, order) => {
          const { messageId } = order
          if (map[messageId]) {
            map[messageId].push(order.source)
          } else {
            map[messageId] = [order.source]
          }
          return map
        }, {})

        const output = Object.keys(arrayObj).map(key => ({ id: key, sources: arrayObj[key] }))

        console.log('Output: ', output)
        this.todayTabContent = `${output[0].sources}: Very low risk, impact minor (2), likelihood low (2).`

        console.log('todayTabContent: ', this.todayTabContent)
      }

      this.newTab1 = this.groupByDay['1']
      this.newTab2 = this.groupByDay['2']
      this.newTab3 = [this.groupByDay['3'], this.groupByDay['4'], this.groupByDay['5']]
    }
  }
}

module.exports = ViewModel
