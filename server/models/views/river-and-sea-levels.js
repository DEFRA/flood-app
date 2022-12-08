const turf = require('@turf/turf')
const moment = require('moment-timezone')
const { bingKeyMaps, floodRiskUrl } = require('../../config')
const pageTitle = 'Find river, sea, groundwater and rainfall levels'
const metaDescription = 'Find river, sea, groundwater and rainfall levels in England. Check the last updated height and state recorded by the gauges.'

function emptyResultsModel (q) {
  return {
    q,
    metaDescription,
    pageTitle: formatTitle(q),
    clientModel: getClientModel()
  }
}

function formatTitle (q) {
  return q ? `${q} - ${pageTitle}` : `${pageTitle}`
}

function disambiguationModel (q, places, rivers) {
  return {
    q,
    metaDescription,
    rivers,
    pageTitle: `${q} - ${pageTitle}`,
    place: places[0],
    clientModel: getClientModel()
  }
}

function riverViewModel (stations) {
  const bbox = createBbox(stations)
  stations.forEach(station => {
    setStationProperties(station)
  })

  const { filters, activeFilter: queryGroup } = setFilters(stations)

  deleteUndefinedProperties(stations)

  const qualifiedRiverName = stations[0].river_qualified_name

  return {
    stations,
    filters,
    queryGroup,
    floodRiskUrl,
    metaDescription,
    pageTitle: `${qualifiedRiverName} - ${pageTitle}`,
    q: qualifiedRiverName,
    clientModel: getClientModel(bbox)
  }
}

function areaViewModel (areaName, stations) {
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
    floodRiskUrl,
    pageTitle,
    metaDescription,
    clientModel: getClientModel(bbox),
    distStatement: `Showing levels within 5 miles of ${areaName}.`
  }
}

function referencedStationViewModel (referencePoint, stations) {
  const center = turf.point([referencePoint.lon, referencePoint.lat]).geometry
  const bbox = createBbox(stations)
  stations.forEach(station => {
    setStationProperties(station)
    station.distance = calcDistance(station, center.coordinates)
  })
  stations.sort((a, b) => a.distance - b.distance)

  const { filters, activeFilter: queryGroup } = setFilters(stations)

  deleteUndefinedProperties(stations)

  return {
    stations,
    filters,
    queryGroup,
    floodRiskUrl,
    pageTitle,
    metaDescription,
    clientModel: getClientModel(bbox),
    distStatement: referencePoint.distStatement
  }
}

function placeViewModel ({ location, place, stations = [], queryGroup }) {
  let distStatement, title, description

  const isEngland = place ? place.isEngland.is_england : true

  stations.forEach(station => {
    setStationProperties(station)
    station.distance = calcDistance(station, place.center)
  })
  stations.sort((a, b) => a.distance - b.distance)

  const { filters, activeFilter } = setFilters(stations, queryGroup)

  deleteUndefinedProperties(stations)

  if (location && isEngland) {
    title = `${location} - ${pageTitle}`
    description = `Find river, sea, groundwater and rainfall levels in ${location}. Check the last updated height and state recorded by the gauges.`
  } else {
    title = pageTitle
    description = metaDescription
  }

  return {
    stations,
    isEngland,
    filters,
    floodRiskUrl,
    distStatement,
    q: location,
    clientModel: getClientModel(isEngland ? place.bbox10k : []),
    queryGroup: activeFilter,
    placeAddress: place.address,
    pageTitle: title,
    metaDescription: description
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

function setStationProperties (station) {
  station.external_name = formatName(station.external_name)
  station.displayData = getDisplayData(station)
  station.latestDatetime = station.status === 'Active' ? getFormattedTime(station) : null
  station.formattedValue = station.status === 'Active' ? formatValue(station, station.value) : null
  station.state = getStationState(station)
  station.group_type = getStationGroup(station)
}

function getClientModel (placeBox = []) {
  return { placeBox, bingMaps: bingKeyMaps }
}

module.exports = {
  riverViewModel,
  areaViewModel,
  referencedStationViewModel,
  placeViewModel,
  disambiguationModel,
  emptyResultsModel
}
