const moment = require('moment-timezone')
const { groupBy } = require('../../util')
const { bingKeyMaps } = require('../../config')
const tz = 'Europe/London'

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
      riverId: this.getRiverId(riverIds),
      stationsBbox: []
    })

    const titles = this.getPageTitle(error, this.riverId, location)
    this.pageTitle = titles.page
    this.subtitle = titles.sub
    const today = moment.tz().endOf('day')

    stations.forEach(station => {
      // Get a bounding box covering the stations on view
      if (this.stationsBbox.length === 0) {
        this.stationsBbox = [station.lon, station.lat, station.lon, station.lat]
      } else {
        this.stationsBbox[0] = station.lon < this.stationsBbox[0] ? station.lon : this.stationsBbox[0]
        this.stationsBbox[1] = station.lat < this.stationsBbox[1] ? station.lat : this.stationsBbox[1]
        this.stationsBbox[2] = station.lon > this.stationsBbox[2] ? station.lon : this.stationsBbox[2]
        this.stationsBbox[3] = station.lat > this.stationsBbox[3] ? station.lat : this.stationsBbox[3]
      }

      station.value_time = this.getTime(station.value_timestamp, today)

      station.state = this.getStationState(station)

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
    this.stationsBbox = this.bboxClip(this.stationsBbox)

    // generate object keyed by river_ids
    this.stations = groupBy(stations, 'river_id')

    this.export = {
      countLevels: this.countLevels,
      placeBbox: place ? place.bbox10k : this.stationsBbox,
      bingMaps: bingKeyMaps
    }

    // set default type checkbox behaviours
    this.checkRivers = this.typeChecked(this.types, ['S', 'M'])
    this.checkCoastal = this.typeChecked(this.types, ['C'])
    this.checkGround = this.typeChecked(this.types, ['G'])
    this.checkRainfall = this.typeChecked(this.types, ['R'])
  }

  getStationState (station) {
    if (station.station_type !== 'C' && station.station_type !== 'G' && station.value) {
      if (station.value >= station.percentile_5) {
        return 'high'
      } else if (station.value < station.percentile_95) {
        return 'low'
      } else {
        return 'normal'
      }
    } else {
      return ''
    }
  }

  getTime (ts, today) {
    const dateDiffDays = today.diff(ts, 'days')
    if (dateDiffDays === 0) {
      return `at ${moment.tz(ts, tz).format('h:mma')}`
    } else if (dateDiffDays === 1) {
      return `at ${moment.tz(ts, tz).format('h:mma')} yesterday`
    } else {
      return `on ${moment.tz(ts, tz).format('DD/MM/YYYY h:mma')}`
    }
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
      titles.page = location ? `${location} - River and sea levels in England` : 'River and sea levels in England'
    }
    return titles
  }
}

module.exports = ViewModel
