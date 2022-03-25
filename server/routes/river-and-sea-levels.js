const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/river-and-sea-levels')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')
const qs = require('querystring')
const route = 'river-and-sea-levels'
const rainfallIdString = 'rainfall-id'

module.exports = [{
  method: 'GET',
  path: `/${route}`,
  handler: async (request, h) => {
    let { location, riverIds, taCode, types, rloiid, rainfallid } = getParameters(request)
    const referer = request.headers.referer
    let model, place, stations, targetArea

    // Convert river Ids into array
    riverIds = riverIds && riverIds.split(',')

    // Map types to db station types
    types = types && types.split(',')

    // if we have a location query then get the place
    if (location && !location.match(/^england$/i)) {
      try {
        place = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        console.error(`Location search error: [${error.name}] [${error.message}]`)
        console.error(error)
        if (error instanceof LocationNotFoundError) {
          // No location found so display zero results
          stations = []
          model = new ViewModel({ location, place, stations, targetArea, riverIds, referer })
        } else {
          // If location search error show national list with error
          stations = await getStations(request)
          model = new ViewModel({ location, place, stations, targetArea, riverIds, error, referer })
        }
        return h.view(route, { model })
      }
      if ((typeof place === 'undefined') || (notinUk(place))) {
        stations = []
        model = new ViewModel({ location, place, stations })
        return h.view(route, { model, referer })
      }
    }

    // get base stations
    stations = await getStations(request, place, taCode, rloiid, rainfallid)

    // filter stations
    stations = filterStations(stations, riverIds, types)

    // optional get ta
    if (taCode) {
      targetArea = await request.server.methods.flood.getTargetArea(taCode)
    }

    // build model
    model = new ViewModel({ location, place, stations, targetArea, riverIds, referer })

    // return view
    return h.view(route, { model })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().allow('').trim().max(200),
        location: joi.string().allow('').trim().max(200),
        'river-id': joi.string(),
        'target-area': joi.string(),
        types: joi.string().allow('S', 'M', 'C', 'G', 'R'),
        'rloi-id': joi.string(),
        'rainfall-id': joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      }),
      failAction: (request, h, _err) => {
        return h.view('404').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: `/${route}`,
  handler: async (request, h) => {
    let payload = request.payload.toString()
    payload = qs.parse(payload, '&', '=', {
      maxKeys: 2000
    })

    // validate payload due to limitations of hapi post parsing restricting to 1000 keys
    const schema = joi.object({
      q: joi.string().allow('').trim().max(200),
      'target-area': joi.string().allow(''),
      types: joi.any().allow(''),
      'rloi-id': joi.any().allow(''),
      'rainfall-id': joi.any().allow(''),
      'river-id': joi.any().allow('')
    })

    const { error, value } = schema.validate(payload)

    if (error) {
      return boom.badRequest(error)
    }

    const { q, 'target-area': taCode, types, 'river-id': riverIds, 'rloi-id': rloiid, 'rainfall-id': rainfallStationId } = value

    // if we only have a location or target area then redirect with query string
    // other wise set session vars
    if (!types && !riverIds) {
      if (q) {
        return h.redirect(`/${route}?q=${encodeURIComponent(q)}`)
      } else if (taCode) {
        return h.redirect(`/${route}?target-area=${encodeURIComponent(taCode)}`)
      } else if (rloiid) {
        return h.redirect(`/${route}?rloi-id=${rloiid}`)
      } else if (rainfallStationId) {
        return h.redirect(`/${route}?rainfall-id=${rainfallStationId}`)
      } else {
        return h.redirect(`/${route}`)
      }
    } else {
      // set these as can be too much data for url parameter
      // this is only required due to non js users...
      nonJavaScriptRoute(request, q, taCode, types, riverIds, rloiid)
      return h.redirect(`/${route}`)
    }
  },
  options: {
    payload: {
      parse: false
    }
  }
}]

const getParameters = request => {
  const redirect = request.yar.get('redirect', true)
  return {
    location: redirect ? request.yar.get('q', true) : request.query.q || request.query.location,
    riverIds: redirect ? request.yar.get('river-id') : request.query['river-id'],
    taCode: redirect ? request.yar.get('ta-code', true) : request.query['target-area'],
    rloiid: redirect ? request.yar.get('rloi-id', true) : request.query['rloi-id'],
    rainfallid: redirect ? request.yar.get(rainfallIdString, true) : request.query[rainfallIdString],
    types: redirect ? request.yar.get('types', true) : request.query.types
  }
}

const getStations = async (request, place, taCode, rloiid, rainfallid) => {
  if (place) {
    return request.server.methods.flood.getStationsWithin(place.bbox10k)
  }
  if (taCode) {
    return request.server.methods.flood.getStationsWithinTargetArea(taCode)
  }
  if (rloiid) {
    const station = await request.server.methods.flood.getStationById(rloiid, 'u')
    const coordinates = JSON.parse(station.coordinates)

    const x = coordinates.coordinates[0]
    const y = coordinates.coordinates[1]

    const stationsWithinRad = await request.server.methods.flood.getStationsByRadius(x, y, 8000)

    stationsWithinRad.originalStation = {
      external_name: station.external_name,
      id: rloiid
    }

    // defaulted to 8km radius
    return stationsWithinRad
  }
  if (rainfallid) {
    const rainfallStation = await request.server.methods.flood.getRainfallStation(rainfallid)

    const x = rainfallStation[0].lon
    const y = rainfallStation[0].lat

    const stationsWithinRad = await request.server.methods.flood.getStationsByRadius(x, y, 8000)

    stationsWithinRad.originalStation = {
      external_name: rainfallStation[0].station_name.replace(/(^\w|\s\w)(\S*)/g, (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()),
      id: rainfallid
    }

    // defaulted to 8km radius
    return stationsWithinRad
  }
  // if no place or ta then return all stations
  return request.server.methods.flood.getStations()
}

const filterStations = (stations, riverIds, types) => {
  if (riverIds) {
    stations = stations.filter(val => riverIds.includes(val.river_id))
  }
  if (types) {
    stations = stations.filter(val => types.includes(val.station_type))
  }
  return stations
}

const notinUk = place => !place.isUK || place.isScotlandOrNorthernIreland

const nonJavaScriptRoute = (request, q, taCode, types, riverIds, rloiid, rainfallid) => {
  request.yar.set('redirect', true)
  q && request.yar.set('q', q)
  taCode && request.yar.set('ta-code', taCode)
  types && request.yar.set('types', types.toString())
  riverIds && request.yar.set('river-id', riverIds.toString())
  rloiid && request.yar.set('rloi-id', rloiid.toString())
  rainfallid && request.yar.set(rainfallIdString, rainfallid.toString())
}
