const severity = require('../severity')
const { groupBy } = require('../../util')
const moment = require('moment-timezone')

class ViewModel {
  constructor ({ place, floods, stations, impacts }) {
    const title = place.name

    Object.assign(this, {
      place,
      floods,
      impacts,
      location: title,
      pageTitle: `${title} flood risk`
    })
    
    const hasFloods = !!floods.length

    // Floods
    if (hasFloods) {
      const activeFloods = floods.filter(flood => flood.severity < 4)
      const inactiveFloods = floods.filter(flood => flood.severity === 4)
      const warnings = floods.filter(flood => flood.severity === 1 || flood.severity === 2)

      this.hasFloods = hasFloods
      this.hasActiveFloods = !!activeFloods.length
      this.hasInactiveFloods = !!inactiveFloods.length

      const highestSeverityId = Math.min(...floods.map(flood => flood.severity))
      this.highestSeverity = severity[highestSeverityId - 1]

      const groups = groupBy(floods, 'severity')
      const groupedFloods = Object.keys(groups).map(group => {
        return {
          floods: groups[group],
          severity: severity[group - 1]
        }
      })

      const floodSummary = []
      groupedFloods.forEach(function (group, i) {
        switch (group.severity.hash) {
          case 'severe':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`${i}A severe flood warning is in force for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a>. There is a danger to life in this area.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;severe flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'} in force nearby. There is a danger to life in these areas.`)
            }
            break
          case 'warning':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`A flood warning is in place for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a>. Flooding is expected in this area.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'} in place nearby. Flooding is expected in these areas.`)
            }
            break
          case 'alert':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`A flood alert is in place for the <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> where some flooding is possible.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;flood alert${group.floods.length > 1 ? 's</a> are' : '</a> is'} ${warnings.length >= 1 ? 'also' : ''} in place in the wider area where some flooding is possible.`)
            }
            break
          case 'removed':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`The flood warning for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> has been removed.`)
            } else {
              floodSummary.push(`${groupedFloods.length > 3 ? '</p><p>' : ''}${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's have' : ' has'} been <a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">removed</a> within the last 24 hours.`)
            }
            break
        }
      })
      this.floodSummary = floodSummary.join(' ')
    }

    // change value_timestamp from UTC
    const today = moment.tz().endOf('day')
    for (var s in stations) {
      // stations[s].value_timestamp = moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mm A')

      const tempDate = stations[s].value_timestamp
      const dateDiffDays = today.diff(tempDate, 'days')

      // If dateDiffDays is zero then timestamp is today so just show time. If dateDiffDays is 1 then timestamp is 'Yesterday' plus time. Any other value
      // show the full date/time.
      if (dateDiffDays === 0) {
        stations[s].value_timestamp = moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mma')
      } else if (dateDiffDays === 1) {
        stations[s].value_timestamp = 'Yesterday ' + moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mma')
      } else {
        stations[s].value_timestamp = moment.tz(stations[s].value_timestamp, 'Europe/London').format('DD/MM/YYYY h:mma')
      }
    }

    // change value into High, Normal, Low
    for (var v in stations) {
      if (stations[v].station_type === 'C') {
        stations[v].value = Math.round(stations[v].value * 10) / 10 + 'm'
      } else {
        if (stations[v].value > stations[v].percentile_5) {
          stations[v].value = 'High'
          this.levelsHighCount += 1
        } else if (stations[v].value < stations[v].percentile_95) {
          stations[v].value = 'Low'
        } else {
          stations[v].value = 'Normal'
        }
      }
    }

    // Count stations that are 'high'
    var highLevelsCount = 0
    var hasHighLevels = false
    for (var w in stations) {
      if (stations[w].value === 'High') {
        highLevelsCount += 1
        hasHighLevels = true
      }
    }
    this.hasHighLevels = hasHighLevels
    this.highLevelsCount = highLevelsCount

    // // TO DO re introduce if invalid dates are to be removed
    // var filteredStations = stations.filter(function (value) {
    //   console.log(value)
    //   return value.value_timestamp !== 'Invalid date'
    // })

    // stations = filteredStations

    // River and sea levels
    this.hasLevels = !!stations.length
    this.levels = groupBy(stations, 'wiski_river_name')

    // Impacts
    // sort impacts order by value
    impacts.sort((a, b) => b.value - a.value)
    // create an array of all active impacts
    this.activeImpacts = impacts.filter(active => active.telemetryactive === true)
    this.hasActiveImpacts = !!this.activeImpacts.length
  }
}

module.exports = ViewModel
