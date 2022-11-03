const turf = require('@turf/turf')
const moment = require('moment-timezone')
const { bingKeyMaps, floodRiskUrl } = require('../../config')

function RiverViewModel (stations) {
  const bbox = createBbox(stations)
  stations.forEach(station => {
    setStationProperties(station)
  })

  const { filters, activeFilter: queryGroup } = setFilters(stations)

  deleteUndefinedProperties(stations)

  return {
    stations,
    filters,
    queryGroup,
    exports: {
      placeBox: bbox,
      bingMaps: bingKeyMaps
    },
    floodRiskUrl,
    distStatement: `Showing levels on ${stations[0].river_name}.`,
    pageTitle: 'Find river, sea, groundwater and rainfall levels',
    metaDescription: 'Find river, sea, groundwater and rainfall levels in England. Check the last updated height and state recorded by the gauges.'
  }

  function setStationProperties (station) {
    station.external_name = formatName(station.external_name)
    station.displayData = getDisplayData(station)
    station.latestDatetime = station.status === 'Active' ? getFormattedTime(station) : null
    station.formattedValue = station.status === 'Active' ? formatValue(station, station.value) : null
    station.state = getStationState(station)
    station.group_type = getStationGroup(station)
  }
}

function AreaViewModel (areaName, stations) {
  const bbox = createBbox(stations)
  stations.forEach(station => {
    setStationProperties(station)
  })

  const { filters, activeFilter: queryGroup } = setFilters(stations)

  deleteUndefinedProperties(stations)

  return {
    stations,
    filters,
    queryGroup,
    exports: {
      placeBox: bbox,
      bingMaps: bingKeyMaps
    },
    floodRiskUrl,
    distStatement: `Showing levels within the target area ${areaName}.`,
    pageTitle: 'Find river, sea, groundwater and rainfall levels',
    metaDescription: 'Find river, sea, groundwater and rainfall levels in England. Check the last updated height and state recorded by the gauges.'
  }

  function setStationProperties (station, referenceCoordinates) {
    station.external_name = formatName(station.external_name)
    station.displayData = getDisplayData(station)
    station.latestDatetime = station.status === 'Active' ? getFormattedTime(station) : null
    station.formattedValue = station.status === 'Active' ? formatValue(station, station.value) : null
    station.state = getStationState(station)
    station.group_type = getStationGroup(station)
  }
}

function ReferencedStationViewModel (referencePoint, stations) {
  const center = turf.point([referencePoint.lon, referencePoint.lat]).geometry
  const bbox = createBbox(stations)
  stations.forEach(station => {
    setStationProperties(station, center.coordinates)
  })
  stations.sort((a, b) => a.distance - b.distance)

  const { filters, activeFilter: queryGroup } = setFilters(stations)

  deleteUndefinedProperties(stations)

  return {
    stations,
    filters,
    queryGroup,
    exports: {
      placeBox: bbox,
      bingMaps: bingKeyMaps
    },
    floodRiskUrl,
    distStatement: referencePoint.distStatement,
    pageTitle: 'Find river, sea, groundwater and rainfall levels',
    metaDescription: 'Find river, sea, groundwater and rainfall levels in England. Check the last updated height and state recorded by the gauges.'
  }

  function setStationProperties (station, referenceCoordinates) {
    station.external_name = formatName(station.external_name)
    station.displayData = getDisplayData(station)
    station.latestDatetime = station.status === 'Active' ? getFormattedTime(station) : null
    station.formattedValue = station.status === 'Active' ? formatValue(station, station.value) : null
    station.state = getStationState(station)
    station.group_type = getStationGroup(station)
    station.distance = calcDistance(station, referenceCoordinates)
  }
}

function ViewModel ({ location, place, stations, referer, queryGroup, rivers, rloiid, rainfallid, originalStation, targetArea, riverid }) {
  let bbox, filters, activeFilter, distStatement, pageTitle, metaDescription, center, stationsBbox
  const isEngland = place ? place.isEngland.is_england : true

  if (stations && isEngland) {
    ({ originalStation, bbox } = mapProperties(rloiid, originalStation, stations, bbox, rainfallid, targetArea, riverid))
    stations.forEach(station => {
      stationProperties(station, place, stations, originalStation)
    })
    stations.sort((a, b) => a.distance - b.distance)

    // ref: https://flaviocopes.com/javascript-destructure-object-to-existing-variable/
    ;({ filters, activeFilter } = setFilters(stations, queryGroup))

    deleteUndefinedProperties(stations)

    queryGroup = activeFilter
  }
  stations = isEngland ? stations : []

  const q = location || originalStation?.external_name || getRiverName(stations)
  // const originalStationId = originalStation?.rloi_id
  const placeName = place ? place.name : null
  // const placeCentre = place ? place.center : []
  const placeAddress = place ? place.address : null
  const exports = {
    placeBox: bbox || getPlaceBox(place, stations),
    bingMaps: bingKeyMaps
  }
  const isMultilpleMatch = rivers?.length > 0

  if (targetArea) {
    distStatement = `Showing levels within 5 miles of ${targetArea.ta_name}.`
  } else if (rloiid || rainfallid) {
    distStatement = `Showing levels within 5 miles of ${q}.`
  }

  if (placeName && isEngland) {
    pageTitle = `${placeName} - Find river, sea, groundwater and rainfall levels`
    metaDescription = `Find river, sea, groundwater and rainfall levels in ${placeName}. Check the last updated height and state recorded by the gauges.`
  } else {
    pageTitle = 'Find river, sea, groundwater and rainfall levels'
    metaDescription = 'Find river, sea, groundwater and rainfall levels in England. Check the last updated height and state recorded by the gauges.'
  }

  return {
    // exposed as class properties - but not used
    // activeFilter,
    // originalStationId,
    // placeName,
    // placeCentre,
    // referer,
    // center,
    // stationsBbox,
    stations,
    isEngland,
    filters,
    queryGroup,
    q,
    placeAddress,
    exports,
    rivers,
    floodRiskUrl,
    isMultilpleMatch,
    distStatement,
    pageTitle,
    metaDescription
  }

  function mapProperties (rloiid, originalStation, stations, bbox, rainfallid, targetArea, riverid) {
    if (rloiid) {
      originalStation = stations.find(station => JSON.stringify(station.rloi_id) === rloiid)
      originalStation.center = getCenter(stations)
      bbox = createBbox(stations)
    }
    if (rainfallid) {
      originalStation = stations.find(station => station.telemetry_id === rainfallid)
      originalStation.center = getCenter(stations)
      bbox = createBbox(stations)
    }
    if (targetArea) {
      bbox = createBbox(stations)
    }
    if (riverid) {
      bbox = createBbox(stations)
    }
    return { originalStation, bbox }
  }

  function stationProperties (station, place, stations, originalStation) {
    station.external_name = formatName(station.external_name)
    station.displayData = getDisplayData(station)
    station.latestDatetime = station.status === 'Active' ? getFormattedTime(station) : null
    station.formattedValue = station.status === 'Active' ? formatValue(station, station.value) : null
    station.state = getStationState(station)

    station.group_type = getStationGroup(station)

    if (!originalStation) {
      const coords = stations.map(s => [Number(s.lat), Number(s.lon)])

      const features = turf.points(coords)

      center = turf.center(features)
    }

    const originCenter = originalStation ? originalStation.center.coordinates : center.geometry.coordinates

    const distance = place ? calcDistance(station, place.center) : calcDistance(station, originCenter)
    station.distance = distance
  }

  function getRiverName (stations) {
    if (stations) {
      return stations[0].river_name
    }
    return ''
  }

  function getPlaceBox (place, stations) {
    let placeBox = []
    if (place && isEngland) {
      placeBox = place.bbox10k
    } else if (stations) {
      placeBox = stationsBbox
    }
    return placeBox
  }
}

function setFilters (stations, queryGroup) {
  const filters = ['river', 'sea', 'rainfall', 'groundwater'].map(item => ({
    type: item,
    count: stations.filter(station => station.group_type === item).length
  }))

  const activeFilter = filters.find(x => x.type === queryGroup) || filters.find(x => x.count > 0) || filters[0]
  return { filters, activeFilter: activeFilter.type }
}

function getCenter (stations) {
  const points = stations.map(station => [Number(station.lat), Number(station.lon)])
  const features = turf.points(points)
  return turf.center(features).geometry
}

function createBbox (stations) {
  const lons = stations.map(s => Number(s.lon))
  const lats = stations.map(s => Number(s.lat))

  return lons.length && lats.length ? [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)] : []
}

function getStationGroup (station) {
  if ((station.station_type === 'S') || (station.station_type === 'M') || (station.station_type === 'C' && station.river_id !== 'Sea Levels')) {
    return 'river'
  } else if (station.station_type === 'C') {
    return 'sea'
  } else if (station.station_type === 'G') {
    return 'groundwater'
  } else {
    return 'rainfall'
  }
}

function getDisplayData (station) {
  return !(station.status === 'Suspended' || station.status === 'Closed' || station.value === null || station.value_erred === true || station.iswales)
}

function calcDistance (station, place) {
  const from = turf.point([station.lon, station.lat])
  const to = turf.point(place)
  const options = { units: 'meters' }

  return turf.distance(from, to, options)
}

function getFormattedTime (station) {
  if (!station.displayData) {
    return null
  } else if (station.value_timestamp) {
    const formattedTime = moment(station.value_timestamp).tz('Europe/London').format('h:mma')
    const formattedDate = moment(station.value_timestamp).tz('Europe/London').format('D MMMM')

    return `Updated ${formattedTime}, ${formattedDate} `
  }
  return null
}

function formatValue (station, val) {
  if (!station.displayData) {
    return null
  } else {
    const dp = station.station_type === 'R' ? 1 : 2
    return parseFloat(Math.round(val * Math.pow(10, dp)) / (Math.pow(10, dp))).toFixed(dp) + (station.station_type === 'R' ? 'mm' : 'm')
  }
}

function getStationState (station) {
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

function formatName (name) {
  return name.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
}

function deleteUndefinedProperties (stations) {
  stations.forEach(station => {
    Object.keys(station).forEach(key => {
      if (station[key] === null) {
        delete station[key]
      }
    })
  })
}

module.exports = {
  RiverViewModel,
  AreaViewModel,
  ReferencedStationViewModel,
  ViewModel
}
