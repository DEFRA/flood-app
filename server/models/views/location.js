const severity = require('../severity')
const { groupBy } = require('../../util')

class ViewModel {
  constructor ({ location, place, floods, stations, impacts }) {
    const title = place.name

    Object.assign(this, {
      q: location,
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
              floodSummary.push(`<a href="/alerts-and-warnings?q=${location}#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;severe flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'} in force nearby. There is a danger to life in these areas.`)
            }
            break
          case 'warning':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`A flood warning is in place for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a>. Flooding is expected in this area.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=${location}#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'} in place nearby. Flooding is expected in these areas.`)
            }
            break
          case 'alert':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`A flood alert is in place for the <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> where some flooding is possible.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=${location}#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;flood alert${group.floods.length > 1 ? 's</a> are' : '</a> is'} ${warnings.length >= 1 ? 'also' : ''} in place in the wider area where some flooding is possible.`)
            }
            break
          case 'removed':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`The flood warning for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> has been removed.`)
            } else {
              floodSummary.push(`${groupedFloods.length > 3 ? '</p><p>' : ''}${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's have' : ' has'} been <a href="/alerts-and-warnings?q=${location}#${group.severity.pluralisedHash}">removed</a> within the last 24 hours.`)
            }
            break
        }
      })
      this.floodSummary = floodSummary.join(' ')
    }

    // Count stations that are 'high'
    var hasHighLevels = false
    for (var s in stations) {
      if (stations[s].station_type !== 'C' && stations[s].station_type !== 'G' && stations[s].value) {
        if (stations[s].value > stations[s].percentile_5) {
          hasHighLevels = true
        }
      }
    }
    this.hasHighLevels = hasHighLevels

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
