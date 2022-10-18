const turf = require('@turf/turf')
const moment = require('moment-timezone')
const { bingKeyMaps, floodRiskUrl } = require('../../config')

class ViewModel {
  constructor ({ location, place, stations, referer, queryGroup, rivers, rloiid, rainfallid, originalStation, taCode, riverid, error }) {
    this.error = !!error
    let bbox
    this.isEngland = place ? place.isEngland.is_england : true

    if (stations && this.isEngland) {
      ({ originalStation, bbox } = this.mapProperties(rloiid, originalStation, stations, bbox, rainfallid, taCode, riverid))
      stations.forEach(station => {
        this.stationProperties(station, place, stations, originalStation)
      })
      stations.sort((a, b) => a.distance - b.distance)

      const { filters, activeFilter } = this.setFilters(stations, queryGroup)

      stations.forEach(station => {
        Object.keys(station).forEach(key => {
          if (station[key] === null) {
            delete station[key]
          }
        })
      })

      this.stations = this.isEngland ? stations : []
      this.filters = filters
      this.queryGroup = activeFilter.type
    }

    this.q = location || originalStation?.external_name || this.getRiverName(stations)
    this.originalStationId = originalStation?.rloi_id
    this.placeName = place ? place.name : null
    this.placeCentre = place ? place.center : []
    this.placeAddress = place ? place.address : null
    this.export = {
      placeBox: bbox || this.getPlaceBox(place, stations),
      bingMaps: bingKeyMaps
    }
    this.referer = referer
    this.rivers = rivers
    this.floodRiskUrl = floodRiskUrl
    this.isMultilpleMatch = this.checkMultipleMatch(rivers, stations)

    if (this.placeName && this.isEngland) {
      this.pageTitle = `${this.placeName} - Find river, sea, groundwater and rainfall levels`
      this.metaDescription = `Find river, sea, groundwater and rainfall levels in ${this.placeName}. Check the last updated height and state recorded by the gauges.`
    } else {
      this.pageTitle = 'Find river, sea, groundwater and rainfall levels'
      this.metaDescription = 'Find river, sea, groundwater and rainfall levels in England. Check the last updated height and state recorded by the gauges.'
    }
  }

  setFilters (stations, queryGroup) {
    const filters = ['river', 'sea', 'rainfall', 'groundwater'].map(item => ({
      type: item,
      count: stations.filter(station => station.group_type === item).length
    }))

    const activeFilter = filters.find(x => x.type === queryGroup) || filters.find(x => x.count > 0) || filters[0]
    return { filters, activeFilter }
  }

  mapProperties (rloiid, originalStation, stations, bbox, rainfallid, taCode, riverid) {
    if (rloiid) {
      originalStation = stations.find(station => JSON.stringify(station.rloi_id) === rloiid)
      const center = this.createCenter(stations)
      originalStation.center = center.geometry
      bbox = this.createBbox(stations)
    }
    if (rainfallid) {
      originalStation = stations.find(station => station.telemetry_id === rainfallid)
      const center = this.createCenter(stations)
      originalStation.center = center.geometry
      bbox = this.createBbox(stations)
    }
    if (taCode) {
      bbox = this.createBbox(stations)
    }
    if (riverid) {
      bbox = this.createBbox(stations)
    }
    return { originalStation, bbox }
  }

  createCenter (stations) {
    const points = stations.map(station => [Number(station.lat), Number(station.lon)])
    const features = turf.points(points)
    return turf.center(features)
  }

  createBbox (stations) {
    const lons = stations.map(s => Number(s.lon))
    const lats = stations.map(s => Number(s.lat))

    return lons.length && lats.length ? [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)] : []
  }

  stationProperties (station, place, stations, originalStation) {
    station.external_name = this.formatName(station.external_name)
    station.displayData = this.getDisplayData(station)
    station.latestDatetime = station.status === 'Active' ? this.formattedTime(station) : null
    station.formattedValue = station.status === 'Active' ? this.formatValue(station, station.value) : null
    station.state = this.getStationState(station)

    this.stationGroup(station)

    if (!originalStation) {
      const coords = stations.map(s => [Number(s.lat), Number(s.lon)])

      const features = turf.points(coords)

      this.center = turf.center(features)
    }

    const originCenter = originalStation ? originalStation.center.coordinates : this.center.geometry.coordinates

    const distance = place ? this.calcDistance(station, place.center) : this.calcDistance(station, originCenter)
    station.distance = distance
  }

  stationGroup (station) {
    if ((station.station_type === 'S') || (station.station_type === 'M') || (station.station_type === 'C' && station.river_id !== 'Sea Levels')) {
      station.group_type = 'river'
    } else if (station.station_type === 'C') {
      station.group_type = 'sea'
    } else if (station.station_type === 'G') {
      station.group_type = 'groundwater'
    } else {
      station.group_type = 'rainfall'
    }
  }

  getDisplayData (station) {
    return !(station.status === 'Suspended' || station.status === 'Closed' || station.value === null || station.value_erred === true || station.iswales)
  }

  getRiverName (stations) {
    if (stations) {
      return stations[0].river_name
    }
    return ''
  }

  calcDistance (station, place) {
    const from = turf.point([station.lon, station.lat])
    const to = turf.point(place)
    const options = { units: 'meters' }

    return turf.distance(from, to, options)
  }

  formattedTime (station) {
    if (!station.displayData) {
      return null
    } else if (station.value_timestamp) {
      const formattedTime = moment(station.value_timestamp).tz('Europe/London').format('h:mma')
      const formattedDate = moment(station.value_timestamp).tz('Europe/London').format('D MMMM')

      return `Updated ${formattedTime}, ${formattedDate} `
    }
    return null
  }

  formatValue (station, val) {
    if (!station.displayData) {
      return null
    } else {
      const dp = station.station_type === 'R' ? 1 : 2
      return parseFloat(Math.round(val * Math.pow(10, dp)) / (Math.pow(10, dp))).toFixed(dp) + (station.station_type === 'R' ? 'mm' : 'm')
    }
  }

  getStationState (station) {
    if (!station.displayData) {
      return null
    }
    if (station.station_type !== 'C' && station.value) {
      if (parseFloat(station.value) >= parseFloat(station.percentile_5)) {
        return 'HIGH'
      } else if (parseFloat(station.value) < parseFloat(station.percentile_95)) {
        return 'LOW'
      } else {
        return 'NORMAL'
      }
    } else {
      return null
    }
  }

  formatName (name) {
    return name.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
  }

  getPlaceBox (place, stations) {
    let placeBox = []
    if (place && this.isEngland) {
      placeBox = place.bbox10k
    } else if (stations) {
      placeBox = this.stationsBbox
    }
    return placeBox
  }

  checkMultipleMatch (rivers, _stations) {
    if (rivers?.length) {
      return true
    }
  }
}

module.exports = ViewModel
