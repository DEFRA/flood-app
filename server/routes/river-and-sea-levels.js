'use strict'

const joi = require('@hapi/joi')
const ViewModel = require('../models/views/river-and-sea-levels')
const locationService = require('../services/location')
const util = require('../util')
const route = 'river-and-sea-levels'

module.exports = [{
  method: 'GET',
  path: `/${route}`,
  handler: async (request, h) => {
    const location = request.query.q
    const taCode = request.query['target-area']
    const rloiid = request.query['rloi-id']
    const rainfallid = request.query['rainfall-id']
    const includeTypes = (request.query.includeTypes ?? 'place,river').split(',')
    const riverid = request.query.riverId
    const queryType = request.query.searchType
    const queryGroup = request.query.group
    const referer = request.headers.referer
    let rivers = []
    let place, stations, originalStation, locationError, model

    // if we have a location query then get the place
    if (location && !location.match(/^england$/i)) {
      try {
        place = await locationService.find(util.cleanseLocation(location))
        if (notinUk(place)) {
          locationError = true
        }
      } catch (error) {
        locationError = true
        console.error(`Location search error: [${error.name}] [${error.message}]`)
        console.error(error)
      }
      if (includeTypes.includes('river')) {
        rivers = await request.server.methods.flood.getRiverByName(location)
      }
    }

    if (locationError && rivers.length === 0) {
      model = new ViewModel({ location, place, stations })
      return h.view(route, { model, referer })
    }

    if (place) {
      stations = await getStations(request, place)
    } else if (rloiid) {
      originalStation = await request.server.methods.flood.getStationById(rloiid, 'u')
      stations = await getStations(request, place, rloiid, originalStation)
    } else if (rainfallid) {
      stations = await getStations(request, place, rloiid, originalStation, rainfallid)
    } else if (taCode) {
      stations = await getStations(request, place, rloiid, originalStation, rainfallid, taCode)
    } else if (riverid) {
      stations = await getStations(request, place, rloiid, originalStation, rainfallid, taCode, riverid)
    }

    // blank-sucessful
    model = new ViewModel({ location, place, stations, referer, queryType, queryGroup, rloiid, rainfallid, originalStation, taCode, rivers, riverid })
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
  path: `/${route}`,
  handler: async (request, h) => {
    const { location } = request.payload
    if (!location) {
      return h.redirect(route).takeover()
    } else {
      return h.redirect(`/river-and-sea-levels?q=${encodeURIComponent(location)}`)
    }
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().required()
      }),
      failAction: (_request, h, _err) => h.redirect('river-and-sea-levels').takeover()
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
