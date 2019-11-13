const { groupBy } = require('../../util')
const moment = require('moment-timezone')

class ViewModel {
  constructor ({ location, place, stations }) {
    const placeName = place ? place.name : ''
    const placeBbox = place ? place.bbox : []
    const placeCentre = place ? place.center : []
    const pageTitle = `${placeName ? placeName + ' r' : 'R'}iver and sea levels`

    Object.assign(this, {
      q: location,
      pageTitle: pageTitle,
      metaNoIndex: true,
      placeName: placeName,
      placeBbox: placeBbox,
      placeCentre: placeCentre
    })

    const today = moment.tz().endOf('day')

    if (stations) {
      for (var s in stations) {
        // Create display date property from UTC
        const tempDate = stations[s].value_timestamp
        const dateDiffDays = today.diff(tempDate, 'days')
        // If dateDiffDays is zero then timestamp is today so just show time. If dateDiffDays is 1 then timestamp is 'Yesterday' plus time. Any other value
        // show the full date/time.
        if (dateDiffDays === 0) {
          stations[s].value_time = 'at ' + moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mma')
        } else if (dateDiffDays === 1) {
          stations[s].value_time = 'at ' + moment.tz(stations[s].value_timestamp, 'Europe/London').format('h:mma') + ' yesterday'
        } else {
          stations[s].value_time = 'on ' + moment.tz(stations[s].value_timestamp, 'Europe/London').format('DD/MM/YYYY h:mma')
        }
        // Create state property
        if (stations[s].station_type !== 'C' && stations[s].station_type !== 'G' && stations[s].value) {
          if (stations[s].value > stations[s].percentile_5) {
            stations[s].state = 'high'
          } else if (stations[s].value < stations[s].percentile_95) {
            stations[s].state = 'low'
          } else {
            stations[s].state = 'normal'
          }
        }

        // Create data display property
        if (moment(stations[s].value_timestamp) && !isNaN(parseFloat(stations[s].value))) {
          // Valid data
          stations[s].value = parseFloat(Math.round(stations[s].value * 100) / 100).toFixed(2) + 'm'
          if (stations[s].station_type === 'S' || stations[s].station_type === 'M') {
            stations[s].valueHtml = stations[s].state === 'high' ? '<strong>High</strong>' : stations[s].state.charAt(0).toUpperCase() + stations[s].state.slice(1)
            stations[s].valueHtml += ' (' + stations[s].value + ' <time datetime="' + stations[s].value_timestamp + '">' + stations[s].value_time + '</time>)'
          } else {
            stations[s].valueHtml = stations[s].value + ' ' + ' <time datetime="' + stations[s].value_timestamp + '">' + stations[s].value_time + '</time>'
          }
        } else {
          // Error in data
          stations[s].valueHtml = 'Data not available'
        }
      }
    }

    // Levels
    this.countLevels = stations ? stations.length : 0
    this.levels = stations ? groupBy(stations, 'wiski_river_name') : []
  }
}

module.exports = ViewModel
