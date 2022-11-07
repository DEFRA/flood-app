'use strict'

const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const {
  riverViewModel,
  areaViewModel,
  referencedStationViewModel,
  placeViewModel
} = require('../models/views/river-and-sea-levels')
const locationService = require('../services/location')
const util = require('../util')
const route = 'river-and-sea-levels'
const { bingKeyMaps } = require('../config')

module.exports = [{
  method: 'GET',
  path: `/${route}/location`,
  handler: async (request, h) => {
    const location = request.query.q
    const referer = request.headers.referer
    const includeTypes = request.query.includeTypes.split(',')
    const queryGroup = request.query.group

    let rivers = []
    let places = []
    if (location && !location.match(/^england$/i)) {
      // Note: allow any exceptions to bubble up and be handled by the errors plugin
      if (includeTypes.includes('place')) {
        places = await findPlaces(util.cleanseLocation(location))
      }
      if (includeTypes.includes('river')) {
        rivers = await request.server.methods.flood.getRiverByName(location)
      }
    }

    if (places.length === 0) {
      if (rivers.length === 0) {
        return h.view(route, { model: { q: location, exports: { placeBox: [], bingMaps: bingKeyMaps } }, referer })
      } else if (rivers.length === 1) {
        return h.redirect(`/${route}/river/${rivers[0].river_id}`)
      }
    }

    if (places.length + rivers.length > 1) {
      return h.view(`${route}-list`, { model: { q: location, place: places[0], rivers } })
    }

    const place = places[0]
    const stations = await request.server.methods.flood.getStationsWithin(place.bbox10k)
    const model = placeViewModel({ location, place, stations, referer, queryGroup })
    return h.view(route, { model })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().trim().max(200),
        group: joi.string().trim().max(11),
        includeTypes: joi.string().default('place,river')
      }),
      failAction: (_request, h) => {
        console.error('River and Sea levels search error: Invalid or no string input.')

        return h.redirect()
      }
    }
  }
}, {
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
    // NOTE: this query seems slow
    const stations = await request.server.methods.flood.getRiverById(riverId)

    if (stations.length > 0) {
      const model = riverViewModel(stations)
      return h.view(route, { model })
    }

    return boom.notFound(`Rainfall Gauge "${riverId}" not found`)
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

    return boom.notFound(`Rainfall Gauge "${rloiId}" not found`)
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
    const location = request.query.q
    const taCode = request.query['target-area']
    const rloiid = request.query['rloi-id']
    const rainfallid = request.query['rainfall-id']
    const riverid = request.query.riverId

    if (location) {
      return h.redirect(`/${route}/location?q=${request.query.q}`)
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
    return h.view(route, { model: { q: location, exports: { placeBox: [], bingMaps: bingKeyMaps } } })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().trim().max(200),
        group: joi.string().trim().max(11),
        searchType: joi.string().trim().max(11),
        includeTypes: joi.string(),
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
  path: `/${route}/location`,
  handler: async (request, h) => {
    const { location } = request.payload
    return h.redirect(`/${route}/location?q=${encodeURIComponent(location)}`).takeover()
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().required()
      }),
      failAction: (_request, h, _err) => h.redirect(`/${route}/location`).takeover()
    }
  }
}]

const inUk = place => place?.isUK && !place?.isScotlandOrNorthernIreland

async function findPlaces (location) {
  // NOTE: at the moment locationService.find just returns a single place
  // using the [] for no results and with a nod to upcoming work to return >1 result
  const [place] = await locationService.find(util.cleanseLocation(location))
  return inUk(place) ? [place] : []
}
