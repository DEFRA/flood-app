const moment = require('moment-timezone')

class ViewModel {
  constructor ({ location, place, stations }) {
    const placeName = place ? place.name : ''
    const placeBbox = place ? place.bbox : []
    const placeCentre = place ? place.center : []
    const pageTitle = `${placeName ? placeName + ' latest r' : 'Latest r'}iver and sea levels`

    Object.assign(this, {
      q: location,
      pageTitle: pageTitle,
      metaNoIndex: true,
      placeName: placeName,
      placeBbox: placeBbox,
      placeCentre: placeCentre,
      stations: stations,
      countLevels: 0
    })

    const today = moment.tz().endOf('day')
    const forEachFunc = (station) => {
      this.countLevels++
      // Create display date property from UTC
      const tempDate = station.value_timestamp
      const dateDiffDays = today.diff(tempDate, 'days')
      // If dateDiffDays is zero then timestamp is today so just show time. If dateDiffDays is 1 then timestamp is 'Yesterday' plus time. Any other value
      // show the full date/time.
      if (dateDiffDays === 0) {
        station.value_time = 'at ' + moment.tz(station.value_timestamp, 'Europe/London').format('h:mma')
      } else if (dateDiffDays === 1) {
        station.value_time = 'at ' + moment.tz(station.value_timestamp, 'Europe/London').format('h:mma') + ' yesterday'
      } else {
        station.value_time = 'on ' + moment.tz(station.value_timestamp, 'Europe/London').format('DD/MM/YYYY h:mma')
      }
      // Create state property
      if (station.station_type !== 'C' && station.station_type !== 'G' && station.value) {
        if (station.value > station.percentile_5) {
          station.state = 'high'
        } else if (station.value < station.percentile_95) {
          station.state = 'low'
        } else {
          station.state = 'normal'
        }
      }

      // Create data display property
      if (moment(station.value_timestamp) && !isNaN(parseFloat(station.value))) {
        // Valid data
        station.value = parseFloat(Math.round(station.value * 100) / 100).toFixed(2) + 'm'
        if (station.station_type === 'S' || station.station_type === 'M') {
          station.valueHtml = station.state === 'high' ? '<strong>High</strong>' : station.state.charAt(0).toUpperCase() + station.state.slice(1)
          station.valueHtml += ' (' + station.value + ' <time datetime="' + station.value_timestamp + '">' + station.value_time + '</time>)'
        } else {
          station.valueHtml = station.value + ' ' + ' <time datetime="' + station.value_timestamp + '">' + station.value_time + '</time>'
        }
      } else {
        // Error in data
        station.valueHtml = 'Data not available'
      }
    }

    Object.keys(stations).forEach(key => {
      if (key !== 'rivers') {
        stations[key].forEach(forEachFunc)
      } else {
        stations[key].forEach(river => {
          river.stations.forEach(forEachFunc)
        })
      }
    })
  }
}

module.exports = ViewModel
