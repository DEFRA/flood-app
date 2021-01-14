const joi = require('@hapi/joi')
const ViewModel = require('../models/views/alerts-and-warnings')
const Floods = require('../models/floods')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')

module.exports = [{
  method: 'GET',
  path: '/alerts-and-warnings',
  handler: async (request, h) => {
    const { q: location } = request.query
    var model, place, floods

    const direction = request.query.direction === 'downstream' ? 'd' : 'u'
    const station = request.query.station
      ? await floodService.getStationById(request.query.station, direction)
      : null

    if (station) {
      const warningsAlerts = await floodService.getWarningsAlertsWithinStationBuffer(station.rloi_id)
      floods = new Floods({ floods: warningsAlerts })
      model = new ViewModel({ location, place, floods, station })
      return h.view('alerts-and-warnings', { model })
    } else if (typeof location === 'undefined' || location === '' || location.match(/^england$/i)) {
      const floods = floodService.floods
      model = new ViewModel({ location, place, floods, station })
      return h.view('alerts-and-warnings', { model })
    } else {
      try {
        place = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        console.error(`Location search error: [${error.name}] [${error.message}]`)
        if (error instanceof LocationNotFoundError) {
          // No location found so display zero results
          model = new ViewModel({ location, place, floods, station })
        } else {
          const floods = floodService.floods
          model = new ViewModel({ location, place, floods, station, error })
        }
        return h.view('alerts-and-warnings', { model })
      }

      if (typeof place === 'undefined' || !place.isEngland.is_england) {
        // If no place return empty floods
        model = new ViewModel({ location, place, floods, station })
        return h.view('alerts-and-warnings', { model })
      } else {
        // Data passed to floods model so the schema is the same as cached floods
        const data = await floodService.getFloodsWithin(place.bbox2k)
        floods = new Floods(data)
        model = new ViewModel({ location, place, floods, station })
        return h.view('alerts-and-warnings', { model })
      }
    }
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().allow('').trim().max(200),
        station: joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      })
    }
  }
}, {
  method: 'POST',
  path: '/alerts-and-warnings',
  handler: async (request, h) => {
    const { location } = request.payload
    if (location === '') {
      return h.redirect(`/alerts-and-warnings?q=${location}`)
    }
    return h.redirect(`/alerts-and-warnings?q=${encodeURIComponent(util.cleanseLocation(location))}`)
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().allow('').trim().max(200).required()
      }),
      failAction: (request, h, err) => {
        return h.view('alerts-and-warnings').takeover()
      }
    }
  }
}]
