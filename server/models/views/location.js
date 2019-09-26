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

      const summary = []
      groupedFloods.forEach(function (group, i) {
        switch (group.severity.hash) {
          case 'severe':
            if (i === 0 && group.floods.length === 1) {
              summary.push(`${i}A severe flood warning is in force for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> - danger to life.`)
            } else {
              summary.push(`<a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;severe flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'} in force - danger to life.`)
            }
            break
          case 'warning':
            if (i === 0 && group.floods.length === 1) {
              summary.push(`A flood warning is in place for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> - flooding is expected.`)
            } else {
              summary.push(`<a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's</a> are' : '</a> is'} in place - flooding is expected.`)
            }
            break
          case 'alert':
            if (i === 0 && group.floods.length === 1) {
              summary.push(`A flood alert is in place for the <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> where some flooding is possible.`)
            } else {
              summary.push(`<a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;flood alert${group.floods.length > 1 ? 's</a> are' : '</a> is'} in place in the wider area where some flooding is possible.`)
            }
            break
          case 'removed':
            if (i === 0 && group.floods.length === 1) {
              summary.push(`The flood warning for <a href="/target-area/${group.floods[0].code}">${group.floods[0].description}</a> is no longer in place.`)
            } else {
              summary.push(`</p><p><a href="/alerts-and-warnings?q=location#${group.severity.pluralisedHash}">${group.floods.length}&nbsp;flood warning${group.floods.length > 1 ? 's are' : ' is'} no longer in place</a>.`)
            }
            break
        }
      })
      this.summary = summary.join(' ')

      /*
      1st sentence single

      A severe flood warning is in force for Keswick campsite - danger to life.
      A flood warning is in place for Keswick campsite - flooding is expected.
      A flood alert is in place for Upper Derwent valley where some flooding is possible.
      The flood warning for Cockermouth centre has been removed.
      
      1st sentence multiple or remaining sentence
      
      3 severe flood warnings are|is in force - danger to life.
      3 flood warnings are|is in place - flooding is expected.
      2 flood alerts are|is in place in the wider area where some flooding is possible.
      2 flood warnings have|has been removed.
      */
    }

    // change value_timestamp from UTC
    const today = moment.tz().endOf('day')
    for (var s in stations) {
      // stations[s].value_timestamp = moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mm A')

      let tempDate = stations[s].value_timestamp
      let dateDiffDays = today.diff(tempDate, 'days')

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

    // Rivers
    if (stations.length) {
      this.rivers = groupBy(stations, 'wiski_river_name')
    }

    // Impacts
    if (impacts) {
      // sort impacts order by value
      impacts.sort((a, b) => b.value - a.value)

      // create an array of all active impacts
      const activeImpacts = impacts.filter(active => active.telemetryactive === true)

      this.impacts = impacts
      this.activeImpacts = activeImpacts
    }
  }
}

module.exports = ViewModel
