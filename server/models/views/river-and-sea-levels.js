const moment = require('moment-timezone')
const { groupBy } = require('../../util')
const { bingKeyMaps } = require('../../config')

class ViewModel {
  constructor ({ location, place, stations, targetArea, riverIds, referer, error }) {
    const placeName = place ? place.name : (targetArea && targetArea.ta_name ? targetArea.ta_name : '')
    const placeCentre = place ? place.center : []
    const pageTitle = ''
    const isEngland = place ? place.isEngland.is_england : null
    const placeDescription = targetArea && targetArea.ta_name ? targetArea.ta_name : ''

    // no requirement for heading if mulitple rivers selected for from filter.
    let riverId = riverIds && riverIds.length === 1 ? riverIds[0] : null

    Object.assign(this, {
      q: location,
      pageTitle: pageTitle,
      metaNoIndex: true,
      placeName: placeName,
      placeDescription: placeDescription,
      placeCentre: placeCentre,
      countLevels: stations.length,
      error: error ? true : null,
      riverId,
      isEngland,
      referer: referer
    })

    if (error) {
      this.pageTitle = 'Sorry, there is currently a problem searching a location - River and sea levels in England'
    } else if (riverId) {
      riverId = riverId.replace(/-/g, ' ')

      riverId = riverId.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ')

      this.pageTitle = riverId + ' - ' + 'River and sea levels in England'

      if (riverId === 'Sea Levels') {
        this.subtitle = 'Showing Sea levels.'
        this.pageTitle = 'Sea levels in England'
      } else if (riverId === 'Groundwater Levels') {
        this.subtitle = 'Showing Groundwater levels.'
        this.pageTitle = 'Groundwater levels in England'
      } else {
        this.subtitle = 'Showing ' + riverId + ' levels.'
      }
    } else {
      this.pageTitle = `${location ? location + ' - ' : ''}River and sea levels in England`
    }

    const today = moment.tz().endOf('day')
    const stationsBbox = []

    stations.forEach(station => {
      // Get a bounding box covering the stations on view
      if (stationsBbox.length === 0) {
        stationsBbox[0] = station.lon
        stationsBbox[1] = station.lat
        stationsBbox[2] = station.lon
        stationsBbox[3] = station.lat
      } else {
        stationsBbox[0] = station.lon < stationsBbox[0] ? station.lon : stationsBbox[0]
        stationsBbox[1] = station.lat < stationsBbox[1] ? station.lat : stationsBbox[1]
        stationsBbox[2] = station.lon > stationsBbox[2] ? station.lon : stationsBbox[2]
        stationsBbox[3] = station.lat > stationsBbox[3] ? station.lat : stationsBbox[3]
      }

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
        if (station.value >= station.percentile_5) {
          station.state = 'high'
        } else if (station.value < station.percentile_95) {
          station.state = 'low'
        } else {
          station.state = 'normal'
        }
      }
      if (station.status === 'Suspended' || station.status === 'Closed' || (!station.value && !station.isWales)) {
        station.state = 'error'
      }

      if (station.iswales === true) {
        station.valueHtml = ''
      } else if (station.status === 'Suspended' || station.status === 'Closed') {
        station.valueHtml = 'Data not available'
      } else if (station.value_erred === true || station.value_erred === null) {
        station.valueHtml = 'Data error'
      } else {
        if (moment(station.value_timestamp) && !isNaN(parseFloat(station.value))) {
          // Valid data
          station.value = parseFloat(Math.round(station.value * 100) / 100).toFixed(2) + 'm'
          if (station.station_type === 'S' || station.station_type === 'M') {
            station.valueHtml = station.value + ' <time datetime="' + station.value_timestamp + '">' + station.value_time + '</time>'
            station.valueHtml += station.state === 'high'
              ? ' (<strong>high</strong>) '
              : ' (' + station.state.charAt(0) + station.state.slice(1) + ')'
          } else {
            station.valueHtml = station.value + ' ' + ' <time datetime="' + station.value_timestamp + '">' + station.value_time + '</time>'
          }
        } else {
          // Error in data
          station.valueHtml = 'Data error'
        }
      }
    })

    if (stationsBbox.length > 0) {
      // add on 444m (0.004 deg) to the stations bounding box to stop stations clipping edge of viewport
      stationsBbox[0] = stationsBbox[0] - 0.004
      stationsBbox[1] = stationsBbox[1] - 0.004
      stationsBbox[2] = stationsBbox[2] + 0.004
      stationsBbox[3] = stationsBbox[3] + 0.004
    }

    // generate object keyed by river_ids
    this.stations = groupBy(stations, 'river_id')

    this.export = {
      countLevels: this.countLevels,
      placeBbox: place ? place.bbox10k : stationsBbox,
      bingMaps: bingKeyMaps
    }
  }
}

module.exports = ViewModel
