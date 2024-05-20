const qs = require('qs')
const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/alerts-and-warnings')
const Floods = require('../models/floods')
const locationService = require('../services/location')
const util = require('../util')
const { slugify } = require('./lib/utils')

function createQueryParametersString (queryObject) {
  const { q, location, ...otherParameters } = queryObject
  const queryString = qs.stringify(otherParameters, { addQueryPrefix: true, encode: false })
  return queryString
}

async function routeHandler (request, h) {
  let location = request.query.q || request.query.location || request.payload?.location
  const direction = request.query.direction === 'downstream' ? 'd' : 'u'

  const station = request.query.station
    ? await request.server.methods.flood.getStationById(request.query.station, direction)
    : null

  let model, floods

  request.yar.set('q', location)

  if (station) {
    const warningsAlerts = await request.server.methods.flood.getWarningsAlertsWithinStationBuffer(station.rloi_id)
    floods = new Floods({ floods: warningsAlerts })
    model = new ViewModel({ location, floods, station })
    return h.view('alerts-and-warnings', { model })
  }

  if (location) {
    location = util.cleanseLocation(location)

    const [place] = await locationService.find(location)

    if (!place) {
      if (request.method === 'get') {
        return boom.notFound(`Location ${location} not found`)
      } else {
        return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', href: 'alerts-and-warnings', location }).takeover()
      }
    }

    if (!place.isEngland.is_england) {
      request.logger.warn({
        situation: 'Location search error: Valid response but location not in England.'
      })

      if (request.method === 'post') {
        return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', href: 'alerts-and-warnings', location }).takeover()
      }
    }

    const queryString = createQueryParametersString(request.query)

    return h.redirect(`/alerts-and-warnings/${slugify(place?.name)}${queryString}`).permanent()
  }

  const data = await request.server.methods.flood.getFloods()
  floods = new Floods(data)
  model = new ViewModel({ location, floods })
  return h.view('alerts-and-warnings', { model })
}

async function locationRouteHandler (request, h) {
  const canonicalUrl = request.url.origin + request.url.pathname
  const location = util.cleanseLocation(request.params.location)
  const direction = request.query.direction === 'downstream' ? 'd' : 'u'

  const station = request.query.station
    ? await request.server.methods.flood.getStationById(request.query.station, direction)
    : null

  const [place] = await locationService.find(location)

  let model, floods

  if (station) {
    const warningsAlerts = await request.server.methods.flood.getWarningsAlertsWithinStationBuffer(station.rloi_id)
    floods = new Floods({ floods: warningsAlerts })
    model = new ViewModel({ location, place, floods, station, canonical: canonicalUrl, q: request.yar.get('q') })
    return h.view('alerts-and-warnings', { model })
  }

  if (location.match(/^england$/i)) {
    return h.redirect('/alerts-and-warnings')
  }

  if (slugify(place?.name) !== location) {
    return boom.notFound(`Location ${location} not found`)
  }

  if (!place.isEngland.is_england) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })

    if (request.method === 'get') {
      return boom.notFound(`Location ${location} not found`)
    } else {
      return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', href: 'alerts-and-warnings', location }).takeover()
    }
  }

  // Data passed to floods model so the schema is the same as cached floods
  const data = await request.server.methods.flood.getFloodsWithin(place.bbox2k)
  floods = new Floods(data)
  model = new ViewModel({ location, place, floods, station, canonical: canonicalUrl, q: request.yar.get('q') })
  return h.view('alerts-and-warnings', { model })
}

function failActionHandler (request, h) {
  request.logger.warn({
    situation: 'Location search error: Invalid or no string input.'
  })

  const location = request.query.q || request.query.location || request.payload?.location

  if (!location) {
    return h.redirect('alerts-and-warnings').takeover()
  } else {
    return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', href: 'alerts-and-warnings', location }).takeover()
  }
}

module.exports = [{
  method: 'GET',
  path: '/alerts-and-warnings',
  handler: routeHandler,
  options: {
    validate: {
      query: joi.object({
        q: joi.string().trim().max(200),
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
  path: '/alerts-and-warnings/{location}',
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
  path: '/alerts-and-warnings',
  handler: routeHandler,
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().allow('').trim().max(200).required()
      }),
      failAction: failActionHandler
    }
  }
}]
