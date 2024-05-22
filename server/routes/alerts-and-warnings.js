const qs = require('qs')
const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/alerts-and-warnings')
const Floods = require('../models/floods')
const locationService = require('../services/location')
const util = require('../util')
const { slugify } = require('./lib/utils')

const page = 'alerts-and-warnings'
const QUERY_STRING_LOCATION_MAX_LENGTH = 200

function renderLocationNotFound (location, h) {
  return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', href: page, location }).takeover()
}

function renderNotFound (location) {
  return boom.notFound(`Location ${location} not found`)
}

function createQueryParametersString (queryObject) {
  const { q, location, ...otherParameters } = queryObject
  const queryString = qs.stringify(otherParameters, { addQueryPrefix: true, encode: false })
  return queryString
}

async function routeHandler (request, h) {
  let location = request.query.q || request.query.location || request.payload?.location

  request.yar.set('q', { location })

  const direction = request.query.direction === 'downstream' ? 'd' : 'u'

  let model, floods

  if (request.query.station) {
    const station = await request.server.methods.flood.getStationById(request.query.station, direction)

    const warningsAlerts = await request.server.methods.flood.getWarningsAlertsWithinStationBuffer(station.rloi_id)
    floods = new Floods({ floods: warningsAlerts })
    model = new ViewModel({ location, floods, station })
    return h.view(page, { model })
  }

  if (!location) {
    const data = await request.server.methods.flood.getFloods()
    floods = new Floods(data)
    model = new ViewModel({ location, floods })
    return h.view(page, { model })
  }

  location = util.cleanseLocation(location)

  const [place] = await locationService.find(location)

  if (!place) {
    if (request.method === 'get') {
      return renderNotFound(location)
    }

    return renderLocationNotFound(location, h)
  }

  if (!place.isEngland.is_england) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })

    if (request.method === 'post') {
      return renderLocationNotFound(location, h)
    }
  }

  const queryString = createQueryParametersString(request.query)

  return h.redirect(`/${page}/${slugify(place?.name)}${queryString}`).permanent()
}

async function locationRouteHandler (request, h) {
  const canonicalUrl = request.url.origin + request.url.pathname
  const location = util.cleanseLocation(request.params.location)

  const [place] = await locationService.find(location)

  if (location.match(/^england$/i)) {
    return h.redirect(`/${page}`)
  }

  if (slugify(place?.name) !== location) {
    return renderNotFound(location)
  }

  if (!place?.isEngland.is_england) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })

    if (request.method === 'get') {
      return renderNotFound(location)
    } else {
      return renderLocationNotFound(location, h)
    }
  }

  // Data passed to floods model so the schema is the same as cached floods
  const data = await request.server.methods.flood.getFloodsWithin(place.bbox2k)
  const floods = new Floods(data)
  const model = new ViewModel({ location, place, floods, canonical: canonicalUrl, q: request.yar.get('q')?.location })
  request.yar.set('q', null)
  return h.view(page, { model })
}

function failActionHandler (request, h) {
  request.logger.warn({
    situation: 'Location search error: Invalid or no string input.'
  })

  const location = request.query.q || request.query.location || request.payload?.location

  if (!location) {
    return h.redirect(page).takeover()
  } else {
    return renderLocationNotFound(location, h)
  }
}

module.exports = [{
  method: 'GET',
  path: `/${page}`,
  handler: routeHandler,
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
      failAction: failActionHandler
    }
  }
},
{
  method: 'GET',
  path: `/${page}/{location}`,
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
      failAction: failActionHandler
    }
  }
},
{
  method: 'POST',
  path: `/${page}`,
  handler: routeHandler,
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().allow('').trim().max(QUERY_STRING_LOCATION_MAX_LENGTH).required()
      }),
      failAction: failActionHandler
    }
  }
}]
