const { groupBy } = require('../../util')
const moment = require('moment-timezone')

class ViewModel {
  constructor ({ place, stations }) {
    const title = place.name

    Object.assign(this, {
      place,
      location: title,
      pageTitle: `${title} river and sea levels`
    })

    // change value_timestamp from UTC
    const today = moment.tz().endOf('day')
    for (var s in stations) {
      // stations[s].value_timestamp = moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mm A')

      const tempDate = stations[s].value_timestamp
      const dateDiffDays = today.diff(tempDate, 'days')

      // If dateDiffDays is zero then timestamp is today so just show time. If dateDiffDays is 1 then timestamp is 'Yesterday' plus time. Any other value
      // show the full date/time.
      if (dateDiffDays === 0) {
        stations[s].value_timeDisplay = moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mma')
      } else if (dateDiffDays === 1) {
        stations[s].value_timeDisplay = 'Yesterday ' + moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mma')
      } else {
        stations[s].value_timeDisplay = moment.tz(stations[s].value_timestamp, 'Europe/London').format('DD/MM/YYYY h:mma')
      }
    }

    // Add High, Normal, Low states
    for (var v in stations) {
      if (stations[v].station_type !== 'C' && stations[v].station_type !== 'G') {
        if (stations[v].value > stations[v].percentile_5) {
          stations[v].state = 'High'
          this.levelsHighCount += 1
        } else if (stations[v].value < stations[v].percentile_95) {
          stations[v].state = 'Low'
        } else {
          stations[v].state = 'Normal'
        }
      }
      stations[v].value = parseFloat(Math.round(stations[v].value * 100) / 100).toFixed(2) + 'm'
    }

    // Levels
    if (stations.length) {
      this.levels = groupBy(stations, 'wiski_river_name')
    }
  }
}

module.exports = ViewModel
