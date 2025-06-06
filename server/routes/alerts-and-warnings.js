const joi = require('joi')
const ViewModel = require('../models/views/alerts-and-warnings')
const Floods = require('../models/floods')
const locationService = require('../services/location')
const util = require('../util')
const {
  isLocationEngland,
  isValidLocationSlug,
  isPlaceEngland,
  failActionHandler,
  renderNotFound,
  renderLocationNotFound,
  createQueryParametersString,
  hasInvalidCharacters
} = require('./lib/utils')

const route = 'alerts-and-warnings'
const QUERY_STRING_LOCATION_MAX_LENGTH = 200

async function routeHandler (request, h) {
  let location = request.query.q || request.payload?.location

  location = util.cleanseLocation(location)

  request.yar.set('q', { location })

  const direction = request.query.direction === 'downstream' ? 'd' : 'u'

  let model, floods

  if (request.query.station) {
    const station = await request.server.methods.flood.getStationById(request.query.station, direction)
    const warningsAlerts = await request.server.methods.flood.getWarningsAlertsWithinStationBuffer(station.rloi_id)

    floods = new Floods({ floods: warningsAlerts })
    model = new ViewModel({ location, floods, station })
    return h.view(route, { model })
  }

  if (hasInvalidCharacters(location, request.query.q)) {
    return renderNotFound(location)
  }

  if (!location) {
    const data = await request.server.methods.flood.getFloods()
    floods = new Floods(data)
    model = new ViewModel({ location, floods })
    return h.view(route, { model })
  }

  const [place] = await locationService.find(location)

  if (!place) {
    if (request.method === 'get') {
      return renderNotFound(location)
    }

    return renderLocationNotFound(route, location, h)
  }

  if (!isPlaceEngland(place)) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })

    if (request.method === 'post') {
      return renderLocationNotFound(route, location, h)
    }
  }

  const queryString = createQueryParametersString(request.query)

  return h.redirect(`/${route}/${place?.slug}${queryString}`).permanent()
}

async function locationRouteHandler (request, h) {
  const canonicalUrl = request.url.origin + request.url.pathname
  const location = util.cleanseLocation(request.params.location)

  const [place] = await locationService.get(location)

  if (isLocationEngland(location)) {
    return h.redirect(`/${route}`)
  }

  if (!isValidLocationSlug(location, place)) {
    return renderNotFound(location)
  }

  if (!isPlaceEngland(place)) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })

    return renderNotFound(location)
  }

  // Data passed to floods model so the schema is the same as cached floods
  const data = await request.server.methods.flood.getFloodsWithin(place.bbox2k)
  const floods = new Floods(data)
  const model = new ViewModel({ location, place, floods, canonical: canonicalUrl, q: request.yar.get('q')?.location })
  request.yar.set('q', null)
  return h.view(route, { model })
}

module.exports = [{
  method: 'GET',
  path: `/${route}`,
  handler: (request, h) => {
    if (request.query.q && isLocationEngland(util.cleanseLocation(request.query.q))) {
      return h.redirect(`/${route}`)
    }

    return routeHandler(request, h)
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().trim().max(QUERY_STRING_LOCATION_MAX_LENGTH),
        station: joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      }),
      failAction: (request, h) => failActionHandler(request, h, route)
    }
  }
},
{
  method: 'GET',
  path: `/${route}/{location}`,
  handler: locationRouteHandler,
  options: {
    validate: {
      params: joi.object({
        location: joi.string().lowercase()
      }),
      query: joi.object({
        station: joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      }),
      failAction: (request, h) => failActionHandler(request, h, route)
    }
  }
},
{
  method: 'POST',
  path: `/${route}`,
  handler: (request, h) => {
    if (isLocationEngland(util.cleanseLocation(request.payload.location))) {
      return h.redirect(`/${route}`)
    }

    return routeHandler(request, h)
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string()
          .allow('')
          .trim()
          .max(QUERY_STRING_LOCATION_MAX_LENGTH)
          .required()
      }),
      failAction: (request, h) => failActionHandler(request, h, route)
    }
  }
}]
