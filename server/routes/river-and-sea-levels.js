'use strict'

const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/river-and-sea-levels')
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
  path: `/${route}/rainfall/{rainfallid}`,
  handler: async (request, h) => {
    const { rainfallid } = request.params
    const rainfallStation = await request.server.methods.flood.getRainfallStation(rainfallid)

    if (rainfallStation.length > 0) {
      const x = rainfallStation[0].lon
      const y = rainfallStation[0].lat

      const stations = await request.server.methods.flood.getStationsByRadius(x, y, 8000)
      const model = new ViewModel({ stations, rainfallid })
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

    if (rloiid) {
      originalStation = await request.server.methods.flood.getStationById(rloiid, 'u')
      stations = await getStations(request, place, rloiid, originalStation)
    } else if (taCode) {
      stations = await getStations(request, place, rloiid, originalStation, rainfallid, taCode)
      targetArea = await request.server.methods.flood.getTargetArea(taCode)
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
  } else if (rainfallid) {
    const rainfallStation = await request.server.methods.flood.getRainfallStation(rainfallid)

    const x = rainfallStation[0].lon
    const y = rainfallStation[0].lat

    return request.server.methods.flood.getStationsByRadius(x, y, 8000)
  } else if (taCode) {
    return request.server.methods.flood.getStationsWithinTargetArea(taCode)
  } else if (riverid) {
    return request.server.methods.flood.getRiverById(riverid)
  } else {
    return request.server.methods.flood.getStationsWithin(place.bbox10k)
  }
}

const notinUk = place => !place.isUK || place.isScotlandOrNorthernIreland

async function findPlace (location) {
  let place
  try {
    place = await locationService.find(util.cleanseLocation(location))
    place = notinUk(place) ? undefined : place
  } catch (error) {
    console.error(`Location search error: [${error.name}] [${error.message}]`)
    console.error(error)
  }
  return place
}
