'use strict'

const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const { AreaViewModel, ReferencedStationViewModel, ViewModel } = require('../models/views/river-and-sea-levels')
const locationService = require('../services/location')
const util = require('../util')
const route = 'river-and-sea-levels'

module.exports = [{
  method: 'GET',
  path: `/${route}/location`,
  handler: async (request, h) => {
    const location = request.query.q
    const referer = request.headers.referer
    const includeTypes = request.query.includeTypes.split(',')
    const queryGroup = request.query.group

    let rivers = []
    let place
    if (location && !location.match(/^england$/i)) {
      // Note: allow any exceptions to bubble up and be handled by the errors plugin
      if (includeTypes.includes('place')) {
        place = await findPlace(util.cleanseLocation(location))
      }
      if (includeTypes.includes('river')) {
        rivers = await request.server.methods.flood.getRiverByName(location)
      }
    }
    if (!place && rivers.length === 0) {
      return h.view(route, { model: { q: location }, referer })
    }
    const stations = place ? await getStations(request, place) : undefined
    const model = new ViewModel({ location, place, stations, referer, rivers, queryGroup })
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
      const model = AreaViewModel(targetArea.ta_name, stations)
      return h.view(route, { model })
    }

    return boom.notFound(`Target area "${targetAreaCode}" not found`)
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
      const model = new ReferencedStationViewModel(referencePoint, stations)
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
    const queryType = request.query.searchType
    const queryGroup = request.query.group
    let place, stations, originalStation, targetArea

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
      originalStation = await request.server.methods.flood.getStationById(rloiid, 'u')
      stations = await getStations(request, place, rloiid, originalStation)
    } else if (riverid) {
      stations = await getStations(request, place, rloiid, originalStation, rainfallid, taCode, riverid)
    }

    // blank-sucessful
    const model = new ViewModel({ location, place, stations, queryType, queryGroup, rloiid, rainfallid, originalStation, targetArea, riverid })
    return h.view(route, { model })
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

const getStations = async (request, place, rloiid, originalStation, rainfallid, taCode, riverid) => {
  if (rloiid) {
    const station = originalStation
    const coordinates = JSON.parse(station.coordinates)

    const x = coordinates.coordinates[0]
    const y = coordinates.coordinates[1]

    return request.server.methods.flood.getStationsByRadius(x, y, 8000)
  } else if (riverid) {
    return request.server.methods.flood.getRiverById(riverid)
  } else {
    return request.server.methods.flood.getStationsWithin(place.bbox10k)
  }
}

const inUk = place => place?.isUK && !place?.isScotlandOrNorthernIreland

async function findPlace (location) {
  const [place] = await locationService.find(util.cleanseLocation(location))
  return inUk(place) ? place : undefined
}
