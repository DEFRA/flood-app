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
      riverId: this.getRiverId(riverIds),
      stationsBbox: [],
      originalStation: stations.originalStation
    })

    const titles = this.getPageTitle(error, this.riverId, location)
    this.pageTitle = titles.page
    this.subtitle = titles.sub

    stations.forEach(station => {
      // Get a bounding box covering the stations on view
      if (this.stationsBbox.length === 0) {
        this.stationsBbox = [station.lon, station.lat, station.lon, station.lat]
      } else {
        this.stationsBbox[0] = Math.min(station.lon, this.stationsBbox[0])
        this.stationsBbox[1] = Math.min(station.lat, this.stationsBbox[1])
        this.stationsBbox[2] = Math.max(station.lon, this.stationsBbox[2])
        this.stationsBbox[3] = Math.max(station.lat, this.stationsBbox[3])
      }
      station.displayData = this.getDisplayData(station)
      station.state = this.getStationState(station)
      station.sub = this.getStationSubText(station)
      station.val = this.formatValue(station, station.value)
      station.valueState = this.getValueState(station)
      if (station.station_type === 'R') {
        station.oneHourTotal = this.formatValue(station, station.one_hr_total)
        station.sixHourTotal = this.formatValue(station, station.six_hr_total)
        station.dayTotal = this.formatValue(station, station.day_total)
        station.external_name = this.formatName(station.external_name)
      }
      station.cols = this.getStationColumns(station)
    })

    // add on 444m (0.004 deg) to the stations bounding box to stop stations clipping edge of viewport
    this.stationsBbox = this.bboxClip(this.stationsBbox)

    // generate object keyed by river_ids
    this.stations = groupBy(stations, 'river_id')

    this.export = {
      countLevels: this.countLevels,
      placeBbox: this.getPlaceBox(place),
      bingMaps: bingKeyMaps,
      originalStationId: this.getStationId(this.originalStation)
    }

    // set default type checkbox behaviours
    this.checkRivers = this.typeChecked(this.types, ['S', 'M'])
    this.checkCoastal = this.typeChecked(this.types, ['C'])
    this.checkGround = this.typeChecked(this.types, ['G'])
    this.checkRainfall = this.typeChecked(this.types, ['R'])

    // Show or Hide filters
    this.showTypeFilter = (this.checkRivers || this.checkCoastal || this.checkGround || this.checkRainfall)
    this.showRiverFilter = this.rivers && this.rivers.length > 0
    this.showFilters = this.showTypeFilter || this.showRiverFilter
  }

  getPlaceBox (place) {
    return place ? place.bbox10k : this.stationsBbox
  }

  getStationId (originalStation) {
    return originalStation ? `stations.${originalStation.id}` : ''
  }

  getStationSubText (station) {
    if (station.iswales === true) {
      return ''
    }

    if (station.status === 'Suspended' || station.status === 'Closed') {
      return 'Data not available'
    }

    if (station.value_erred === true) {
      return 'Data error'
    }

    if (moment(station.value_timestamp) && !isNaN(parseFloat(station.value))) {
      return this.formatExpiredTime(station.value_timestamp)
    }
    return 'Data error'
  }

  getValueState (station) {
    if (!station.displayData) {
      return 'error'
    }
    if (station.station_type === 'R') {
      switch (true) {
        case (station.one_hr_total > 4):
          return 'heavy'
        case (station.one_hr_total > 0.5):
          return 'moderate'
        case (station.one_hr_total > 0):
          return 'light'
        default:
          return ''
      }
    }
    if (station.station_type === 'S' || station.station_type === 'M') {
      if (station.value >= station.percentile_5) {
        return 'high'
      } else {
        return ''
      }
    }
    return ''
  }

  getStationColumns (station) {
    const cols = []
    if (!station.displayData) {
      return cols
    }
    if (station.station_type === 'R') {
      cols.push({
        title: 'Last hour',
        value: station.oneHourTotal,
        description: '1 hour'
      })
      cols.push({
        title: 'Last 6 hours',
        value: station.sixHourTotal,
        description: '6 hours'
      })
      cols.push({
        title: 'Last 24 hours',
        value: station.dayTotal,
        description: '24 hours'
      })
      return cols
    } else {
      if (station.station_type !== 'C') {
        cols.push({
          title: 'State',
          value: station.state,
          description: ''
        })
      }
      cols.push({
        title: 'Height',
        value: station.val,
        description: ''
      })
    }
    return cols
  }

  getDisplayData (station) {
    return !(station.status === 'Suspended' || station.status === 'Closed' || !station.value || station.value_erred === true || station.iswales)
  }

  formatName (name) {
    return name.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
  }

  formatExpiredTime (date) {
    const duration = (new Date() - new Date(date))
    const mins = Math.floor(duration / (1000 * 60))
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const days = parseInt(Math.floor(hours / 24))
    if (mins < 91) {
      return `${mins} minutes ago`
    } else {
      if (hours < 48) {
        return `${hours} hours ago`
      } else {
        return `${days} ago`
      }
    }
  }

  formatValue (station, val) {
    const dp = station.station_type === 'R' ? 1 : 2
    return parseFloat(Math.round(val * Math.pow(10, dp)) / (Math.pow(10, dp))).toFixed(dp) + (station.station_type === 'R' ? 'mm' : 'm')
  }

  getStationState (station) {
    if (!station.displayData) {
      return ''
    }
    if (station.station_type !== 'C' && station.value) {
      if (station.value >= station.percentile_5) {
        return 'High'
      } else if (station.value < station.percentile_95) {
        return 'Low'
      } else {
        return 'Normal'
      }
    } else {
      return ''
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
