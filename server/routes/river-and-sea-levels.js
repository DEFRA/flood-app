'use strict'

const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const {
  riverViewModel,
  areaViewModel,
  referencedStationViewModel,
  placeViewModel,
  disambiguationModel,
  emptyResultsModel
} = require('../models/views/river-and-sea-levels')
const locationService = require('../services/location')
const util = require('../util')
const route = 'river-and-sea-levels'

module.exports = [{
  method: 'GET',
  path: `/${route}/target-area/{targetAreaCode}`,
  handler: async (request, h) => {
    const { targetAreaCode } = request.params
    const targetArea = await request.server.methods.flood.getTargetArea(targetAreaCode)

    if (targetArea) {
      const stations = await request.server.methods.flood.getStationsWithinTargetArea(targetAreaCode)
      const model = areaViewModel(targetArea.ta_name, stations)
      return h.view(route, { model })
    }

    return boom.notFound(`Target area "${targetAreaCode}" not found`)
  }
}, {
  method: 'GET',
  path: `/${route}/river/{riverId}`,
  handler: async (request, h) => {
    const { riverId } = request.params
    const stations = await request.server.methods.flood.getRiverById(riverId)

    if (stations.length > 0) {
      const model = riverViewModel(stations)
      return h.view(route, { model })
    }

    return boom.notFound(`River"${riverId}" not found`)
  }
}, {
  method: 'GET',
  path: `/${route}/rloi/{rloiId}`,
  handler: async (request, h) => {
    const { rloiId } = request.params
    const riverLevelStation = await request.server.methods.flood.getStationById(rloiId, 'u')
    const coordinates = JSON.parse(riverLevelStation.coordinates)

    if (riverLevelStation) {
      const radius = 8000 // metres
      const distanceInMiles = Math.round(radius / 1609.344)
      const referencePoint = {
        lat: coordinates.coordinates[1],
        lon: coordinates.coordinates[0],
        distStatement: `Showing levels within ${distanceInMiles} miles of ${riverLevelStation.external_name}.`
      }
      const stations = await request.server.methods.flood.getStationsByRadius(referencePoint.lon, referencePoint.lat, radius)
      const model = referencedStationViewModel(referencePoint, stations)
      return h.view(route, { model })
    }

    return boom.notFound(`RLOI "${rloiId}" not found`)
  }
}, {
  method: 'GET',
  path: `/${route}/rainfall/{rainfallid}`,
  handler: async (request, h) => {
    const { rainfallid } = request.params
    const rainfallStations = await request.server.methods.flood.getRainfallStation(rainfallid)

    if (rainfallStations.length > 0) {
      const rainfallStation = rainfallStations[0]
      const radius = 8000 // metres
      const distanceInMiles = Math.round(radius / 1609.344)
      const referencePoint = {
        lat: rainfallStation.lat,
        lon: rainfallStation.lon,
        distStatement: `Showing levels within ${distanceInMiles} miles of ${rainfallStation.station_name}.`
      }
      const stations = await request.server.methods.flood.getStationsByRadius(referencePoint.lon, referencePoint.lat, radius)
      const model = referencedStationViewModel(referencePoint, stations)
      return h.view(route, { model })
    }

    return boom.notFound(`Rainfall Gauge "${rainfallid}" not found`)
  }
}, {
  method: 'GET',
  path: `/${route}`,
  handler: async (request, h) => {
    const taCode = request.query['target-area']
    const rloiid = request.query['rloi-id']
    const rainfallid = request.query['rainfall-id']
    const riverid = request.query.riverId

    // note: the redirects below are to handle any bookmarks users may have as all internal links use the new format
    // the redirects can be removed at some point in the future when we are no longer concerned about broken bookmarks
    if (request.query.q) {
      return locationQueryHandler(request, h)
    }
    if (rainfallid) {
      return h.redirect(`/${route}/rainfall/${rainfallid}`)
    }
    if (taCode) {
      return h.redirect(`/${route}/target-area/${taCode}`)
    }
    if (rloiid) {
      return h.redirect(`/${route}/rloi/${rloiid}`)
    }
    if (riverid) {
      return h.redirect(`/${route}/river/${riverid}`)
    }
    return h.view(route, { model: emptyResultsModel() })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().trim().max(200),
        group: joi.string().trim().max(11),
        searchType: joi.string().trim().max(11),
        includeTypes: joi.string().default('place,river'),
        'rloi-id': joi.string(),
        'rainfall-id': joi.string(),
        'target-area': joi.string(),
        riverId: joi.string()
      }),
      failAction: (_request, h) => {
        console.error('River and Sea levels search error: Invalid or no string input.')

        return h.redirect()
      }
    }
  }
}, {
  method: 'POST',
  path: `/${route}`,
  handler: async (request, h) => {
    const { location } = request.payload
    return h.redirect(`/${route}?q=${encodeURIComponent(location)}`).takeover()
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().required()
      }),
      failAction: (_request, h, _err) => h.redirect(`/${route}`).takeover()
    }
  }
}]

async function locationQueryHandler (request, h) {
  const location = request.query.q
  const referer = request.headers.referer
  const includeTypes = request.query.includeTypes.split(',')
  const queryGroup = request.query.group

  let rivers = []
  let places = []
  const cleanLocation = util.cleanseLocation(location)
  if (cleanLocation && cleanLocation.length > 1 && !cleanLocation.match(/^england$/i)) {
    if (includeTypes.includes('place')) {
      places = await findPlaces(cleanLocation)
    }
    if (includeTypes.includes('river')) {
      rivers = await request.server.methods.flood.getRiversByName(cleanLocation)
    }
  }

  if (places.length === 0) {
    if (rivers.length === 0) {
      return h.view(route, { model: emptyResultsModel(location) })
    } else if (rivers.length === 1) {
      return h.redirect(`/${route}/river/${rivers[0].id}`)
    }
  }

  if (places.length + rivers.length > 1) {
    return h.view(`${route}-list`, { model: disambiguationModel(location, places, rivers) })
  }

  const place = places[0]
  const stations = await request.server.methods.flood.getStationsWithin(place.bbox10k)
  const model = placeViewModel({ location, place, stations, referer, queryGroup })
  return h.view(route, { model })
}

const inUk = place => place?.isUK && !place?.isScotlandOrNorthernIreland

async function findPlaces (location) {
  // NOTE: at the moment locationService.find just returns a single place
  // using the [] for no results and with a nod to upcoming work to return >1 result
  const [place] = await locationService.find(location)
  return inUk(place) ? [place] : []
}
