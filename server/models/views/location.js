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

    // Floods
    if (floods.length) {
      const activeFloods = floods.filter(flood => flood.severity < 4)
      const severeFloods = floods.filter(flood => flood.severity === 1)
      const warningFloods = floods.filter(flood => flood.severity === 2)
      const alertFloods = floods.filter(flood => flood.severity === 3)
      const inactiveFloods = floods.filter(flood => flood.severity === 4)

      const hasActiveFloods = !!activeFloods.length
      const hasInactiveFloods = !!inactiveFloods.length
      const groups = groupBy(floods, 'severity')
      const groupedFloods = Object.keys(groups).map(group => {
        return {
          floods: groups[group],
          severity: severity[group - 1]
        }
      })

      const highestSeverityId = Math.min(...floods.map(flood => flood.severity))
      const highestSeverity = severity[highestSeverityId - 1]

      const primaryGroup = groupedFloods[0].floods
      const primaryList = primaryGroup.map((flood, i) => {
        return `${primaryGroup.length > 1 && i === primaryGroup.length - 1 ? 'and ' : ''}${primaryGroup.length > 0 ? `<a href="/target-area/${primaryGroup[i].code}">${primaryGroup[i].description}</a>` : ''}`
      }).join(' ')

      // Primary statement (first sentence)
      var primaryStatement = ''
      if (activeFloods) { // alert, warning or severe
        switch (highestSeverity.name) {
          case 'severe':
            primaryStatement = `${primaryGroup.length} severe flood warning${primaryGroup.length > 1 ? 's are' : ' is'} in force ${activeFloods.length > 1 ? '' : 'for ' + primaryList} where there is a danger to life`
            break
          case 'warning':
            primaryStatement = `${primaryGroup.length} flood warning${primaryGroup.length > 1 ? 's are' : ' is'} in force ${activeFloods.length > 1 ? '' : 'for ' + primaryList} where flooding is expected`
            break
          case 'alert':
            primaryStatement = `${primaryGroup.length > 1 ? primaryGroup.length : 'A'} flood alert${primaryGroup.length > 1 ? 's are' : ' is'} in place ${activeFloods.length > 1 ? '' : 'for ' + primaryList} where some flooding is possible`
            break
        }
      }

      // Secondary statement (optional)
      var secondaryStatement = ''
      if (floods.length > primaryGroup.length || floods.length > 2) {
        if (warningFloods.length && severeFloods.length) {
          secondaryStatement += `${alertFloods.length ? ', ' : ' and '} ${warningFloods.length} flood warning${warningFloods.length > 1 ? 's (flooding is expected) are' : ' (flooding is expected) is'} also in force ${alertFloods.length ? 'and' : '.'}`
        }
        if (alertFloods.length && (severeFloods.length || warningFloods.length)) {
          secondaryStatement += ` and ${alertFloods.length} flood alert${alertFloods.length > 1 ? 's (some flooding is possible) are' : ' (some flooding is possible) is'} ${!!severeFloods.length && !!warningFloods.length ? 'also' : ''} in place in the wider area.`
        }
      } else {
        secondaryStatement += `.`
      }

      // Inactive floods (optional)
      var inactiveStatement = ''
      if (hasInactiveFloods) {
        if (inactiveFloods.length > 2 || hasActiveFloods) {
          inactiveStatement = `
            ${inactiveFloods.length} flood warning${inactiveFloods.length > 1 ? 's have' : ' has'} been removed.
          `
        } else {
          inactiveStatement = `
            ${primaryGroup.length > 1 ? 'Flood warnings' : 'The flood warning'} for ${primaryList} ${primaryGroup.length > 1 ? 'have' : 'has'} been removed.
          `
        }
      }

      this.highestSeverity = highestSeverity
      this.groupedFloods = groupedFloods
      this.floodsPrimary = primaryStatement
      this.floodsSecondary = secondaryStatement + inactiveStatement
      this.hasFloodsSecondary = !!this.floodsSecondary.length
      this.hasFloodsList = !!(floods.length > primaryGroup.length || floods.length > 1)
      this.activeFloods = activeFloods
      this.hasActiveFloods = hasActiveFloods
      this.inactiveFloods = inactiveFloods
      this.hasInactiveFloods = hasInactiveFloods
    }

    // change value_timestamp from UTC
    for (var s in stations) {
      stations[s].value_timestamp = moment.tz(stations[s].value_timestamp, 'Europe/London').format('H:mma')
    // stations.splice(stations.findIndex(stations => stations[s].value_erred === null), 1)
    }

    // console.log('stations', stations)
    // stations = stations.filter(item => item.value_erred !== null)
    // console.log('updatedStations', updatedStations.length)

    // change value into High, Normal, Low
    for (var v in stations) {
      if (stations[v].value > stations[v].percentile_5) {
        stations[v].value = 'High'
      } else if (stations[v].value < stations[v].percentile_95) {
        stations[v].value = 'Low'
      } else {
        stations[v].value = 'Normal'
      }
    }

    // // TO DO re introduce if invalid dates are to be removed
    // var filteredStations = stations.filter(function (value) {
    //   return value.value_erred === false &&
    //          value.percentile_5 !== null &&
    //          value.percentile_95 !== null &&
    //          value.value_timestamp !== 'Invalid date'
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
