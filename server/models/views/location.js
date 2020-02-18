const severity = require('../severity')
const { groupBy } = require('../../util')
const { floodRiskUrl } = require('../../config')

class ViewModel {
  constructor ({ location, place, floods, stations, impacts }) {
    const title = place.name

    Object.assign(this, {
      q: location,
      place,
      floods,
      impacts,
      location: title,
      pageTitle: `${title} flood risk`,
      metaDescription: `Nearby flood alerts and warnings; latest river and sea levels and flood risk advice for residents living in the ${title} area.`,
      floodRiskUrl
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

      // Get the most severe severity (not highest since FWIS api change) as the groups are order by most severe
      const mostSevere = groups[0].severity.id
      this.highestSeverity = groups[0].severity

      const floodSummary = []
      groups.forEach((group, i) => {
        switch (group.severity.hash) {
          case 'severe':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`A severe flood warning is in force for <a href="/target-area/${group.floods[0].ta_code}">${group.floods[0].ta_name}</a>. There is a danger to life in this area.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=${location}${group.severity.id !== mostSevere ? '#' + group.severity.pluralisedHash : ''}">${group.floods.length}&nbsp;severe flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'} in force nearby. There is a danger to life in these areas.`)
            }
            break
          case 'warning':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`A flood warning is in place for <a href="/target-area/${group.floods[0].ta_code}">${group.floods[0].ta_name}</a>. Some flooding is expected in this area.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=${location}${group.severity.id !== mostSevere ? '#' + group.severity.pluralisedHash : ''}">${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'}${severeWarnings.length >= 1 ? ' also ' : ' '}in place nearby. Some flooding is expected in ${group.floods.length > 1 ? 'these areas' : 'this area'}.`)
            }
            break
          case 'alert':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`A flood alert is in place for the <a href="/target-area/${group.floods[0].ta_code}">${group.floods[0].ta_name}</a>. Some flooding is possible in this area.`)
            } else {
              floodSummary.push(`<a href="/alerts-and-warnings?q=${location}${group.severity.id !== mostSevere ? '#' + group.severity.pluralisedHash : ''}">${group.floods.length}&nbsp;flood alert${group.floods.length > 1 ? 's</a> are' : '</a> is'} ${group.severity.id !== mostSevere && !(severeWarnings.length && warnings.length) ? 'also' : ''} in place in the wider area where some flooding is possible.`)
            }
            break
          case 'removed':
            if (i === 0 && group.floods.length === 1) {
              floodSummary.push(`The flood warning for <a href="/target-area/${group.floods[0].ta_code}">${group.floods[0].ta_name}</a> has been removed.`)
            } else {
              floodSummary.push(`${groups.length > 3 ? '</p><p>' : ''}${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's have' : ' has'} been <a href="/alerts-and-warnings?q=${location}${group.severity.id !== mostSevere ? '#' + group.severity.pluralisedHash : ''}">removed</a> within the last 24 hours.`)
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
