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
const {
  slugify,
  failActionHandler,
  renderNotFound,
  renderLocationNotFound,
  createQueryParametersString,
  isValidLocationSlug,
  isLocationEngland,
  isPlaceEngland
} = require('./lib/utils')

const route = 'river-and-sea-levels'
const QUERY_STRING_LOCATION_MAX_LENGTH = 200

const miles = 1609.344
const joiValidationQMax = 200
const joiValidationGroupMax = 11
const joiValidationSearchTypeMax = 11

async function locationRouteHandler (request, h) {
  const referer = request.headers.referer
  const queryGroup = request.query.group

  const canonicalUrl = request.url.origin + request.url.pathname
  const location = util.cleanseLocation(request.params.location)

  const [place] = await locationService.find(location)

  if (isLocationEngland(location)) {
    return h.redirect(`/${route}`)
  } else if (isValidLocationSlug(location, place)) {
    return renderNotFound(location)
  } else if (!place?.isEngland.is_england) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })
    return renderNotFound(location)
  } else {
    const stations = await request.server.methods.flood.getStationsWithin(place.bbox10k)
    const model = placeViewModel({ location, place, stations, referer, queryGroup, canonical: canonicalUrl, q: request.yar.get('q')?.location })
    request.yar.set('q', null)
    return h.view(route, { model })
  }
}

async function locationQueryHandler (request, h) {
  const location = request.query.q || request.payload?.location

  let rivers = []
  let places = []

  request.yar.set('q', { location })

  const cleanLocation = util.cleanseLocation(location)

  if (isLocationEngland(cleanLocation)) {
    return h.redirect(`/${route}`)
  }

  if (cleanLocation.length > 1 && !cleanLocation.match(/^england$/i)) {
    rivers = await request.server.methods.flood.getRiversByName(cleanLocation)
    places = await findPlaces(cleanLocation)
  }

  if (places.length + rivers.length > 1) {
    return h.view(`${route}-list`, { model: disambiguationModel(location, places, rivers) })
  }

  if (places.length === 0) {
    if (rivers.length === 0) {
      return renderNotFound(location)
    }

    if (rivers.length === 1) {
      return h.redirect(`/${route}/river/${rivers[0].id}`)
    }
  }

  const place = places[0]

  if (!isPlaceEngland(place)) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })

    return renderLocationNotFound(route, location, h)
  }

  const queryString = createQueryParametersString(request.query)

  return h.redirect(`/${route}/${slugify(place?.name)}${queryString}`).permanent()
}

async function findPlaces (location) {
  // NOTE: at the moment locationService.find just returns a single place
  // using the [] for no results and with a nod to upcoming work to return >1 result
  const [place] = await locationService.find(location)
  return place ? [place] : []
}

module.exports = [{
  method: 'GET',
  path: `/${route}/target-area/{targetAreaCode}`,
  handler: async (request, h) => {
    const { targetAreaCode } = request.params
    const targetArea = await request.server.methods.flood.getTargetArea(targetAreaCode)

    if (targetArea.ta_name) {
      const stations = await request.server.methods.flood.getStationsWithinTargetArea(targetAreaCode)
      const model = areaViewModel(targetArea.ta_name, stations)
      return h.view(route, { model })
    }
    throw boom.notFound(`Cannot find target area ${targetAreaCode}`)
  },
  options: {
    validate: {
      params: joi.object({
        targetAreaCode: joi.string().regex(/^[a-z0-9_]*$/i).required()
      })
    }
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
      const distanceInMiles = Math.round(radius / miles)
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
    const rainfallStation = await request.server.methods.flood.getRainfallStation(rainfallid)

    if (rainfallStation) {
      const radius = 8000 // metres
      const distanceInMiles = Math.round(radius / miles)
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
        q: joi.string().trim().max(joiValidationQMax),
        group: joi.string().trim().max(joiValidationGroupMax),
        searchType: joi.string().trim().max(joiValidationSearchTypeMax),
        'rloi-id': joi.string(),
        'rainfall-id': joi.string(),
        'target-area': joi.string(),
        riverId: joi.string()
      }),
      failAction: (request, h) => failActionHandler(request, h, route)
    }
  }
}, {
  method: 'GET',
  path: `/${route}/{location}`,
  handler: locationRouteHandler,
  options: {
    validate: {
      params: joi.object({
        location: joi.string().lowercase()
      }),
      query: joi.object({
        group: joi.string().trim().max(joiValidationGroupMax),
        searchType: joi.string().trim().max(joiValidationSearchTypeMax),
        'rloi-id': joi.string(),
        'rainfall-id': joi.string(),
        'target-area': joi.string(),
        riverId: joi.string()
      }),
      failAction: (request, h) => failActionHandler(request, h, route)
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
        location: joi.string()
          .allow('')
          .trim()
          .max(QUERY_STRING_LOCATION_MAX_LENGTH)
          .regex(new RegExp(`^[${util.ALLOWED_SEARCH_CHARS}]*$`)).required()
      }),
      failAction: (request, h) => failActionHandler(request, h, route)
    }
  }
}]
