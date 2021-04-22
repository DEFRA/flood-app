const moment = require('moment-timezone')
const { groupBy } = require('../../util')
const { bingKeyMaps } = require('../../config')

class ViewModel {
  constructor ({ location, place, stations, targetArea, riverIds, referer, error }) {
    Object.assign(this, {
      q: location,
      metaNoIndex: true,
      placeName: this.getPlaceName(place, targetArea),
      placeDescription: this.getPlaceDescription(targetArea),
      placeCentre: place ? place.center : [],
      countLevels: stations.length,
      error: error ? true : null,
      referer: referer,
      rivers: this.getRiverNames(stations),
      types: this.getTypes(stations),
      taCode: targetArea && targetArea.fws_tacode,
      isEngland: place ? place.isEngland.is_england : null,
      riverId: this.getRiverId(riverIds)
    })

    const titles = this.getPageTitle(error, this.riverId, location)
    this.pageTitle = titles.page
    this.subtitle = titles.sub

    const today = moment.tz().endOf('day')
    let stationsBbox = []

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

    // add on 444m (0.004 deg) to the stations bounding box to stop stations clipping edge of viewport
    stationsBbox = this.bboxClip(stationsBbox)

    // generate object keyed by river_ids
    this.stations = groupBy(stations, 'river_id')

    this.export = {
      countLevels: this.countLevels,
      placeBbox: place ? place.bbox10k : stationsBbox,
      bingMaps: bingKeyMaps
    }

    // set default type checkbox behaviours
    this.checkRivers = this.typeChecked(this.types, ['S', 'M'])
    this.checkCoastal = this.typeChecked(this.types, ['C'])
    this.checkGround = this.typeChecked(this.types, ['G'])
    this.checkRainfall = this.typeChecked(this.types, ['R'])
  }

  getRiverId (riverIds) {
    return riverIds && riverIds.length === 1 ? riverIds[0] : null
  }

  getPlaceDescription (targetArea) {
    return targetArea && targetArea.ta_name ? targetArea.ta_name : ''
  }

  getPlaceName (place, targetArea) {
    if (place) {
      return place.name
    }
    if (targetArea && targetArea.ta_name) {
      return targetArea.ta_name
    }
    return ''
  }

  typeChecked (types, type) {
    return this.types.some(a => type.includes(a))
  }

  bboxClip (bbox) {
    if (bbox.length > 0) {
      bbox[0] = bbox[0] - 0.004
      bbox[1] = bbox[1] - 0.004
      bbox[2] = bbox[2] + 0.004
      bbox[3] = bbox[3] + 0.004
    }
    return bbox
  }

  getRiverNames (stations) {
    return stations
      .map(a => `${a.river_id}|${a.river_name}`)
      .filter((val, i, self) => self.indexOf(val) === i)
      .map(a => {
        return {
          river_id: a.split('|')[0],
          river_name: a.split('|')[1]
        }
      })
  }

  getTypes (stations) {
    return stations.map(a => a.station_type).filter((val, i, self) => self.indexOf(val) === i)
  }

  getPageTitle (error, riverId, location) {
    const titles = {
      page: '',
      sub: ''
    }
    if (error) {
      titles.page = 'Sorry, there is currently a problem searching a location - River and sea levels in England'
    } else if (riverId) {
      riverId = riverId.replace(/-/g, ' ')

      riverId = riverId.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ')

      titles.page = `${riverId} - River and sea levels in England`

      if (riverId === 'Sea Levels') {
        titles.sub = 'Showing Sea levels.'
        titles.page = 'Sea levels in England'
      } else if (riverId === 'Groundwater Levels') {
        titles.sub = 'Showing Groundwater levels.'
        titles.page = 'Groundwater levels in England'
      } else {
        titles.sub = `Showing ${riverId} levels.`
      }
    } else {
      titles.page = `${location ? `${location} - ` : ''}River and sea levels in England`
    }
    return titles
  }
}

module.exports = ViewModel
