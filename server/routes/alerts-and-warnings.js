const joi = require('@hapi/joi')
const ViewModel = require('../models/views/alerts-and-warnings')
const Floods = require('../models/floods')
const locationService = require('../services/location')
const util = require('../util')

module.exports = [{
  method: 'GET',
  path: '/alerts-and-warnings',
  handler: async (request, h) => {
    const { q: location } = request.query
    let model, place, floods

    const direction = request.query.direction === 'downstream' ? 'd' : 'u'
    const station = request.query.station
      ? await request.server.methods.flood.getStationById(request.query.station, direction)
      : null

    if (station) {
      const warningsAlerts = await request.server.methods.flood.getWarningsAlertsWithinStationBuffer(station.rloi_id)
      floods = new Floods({ floods: warningsAlerts })
      model = new ViewModel({ location, place, floods, station })
      return h.view('alerts-and-warnings', { model })
    } else if (typeof location === 'undefined' || location === '' || location.match(/^england$/i)) {
      floods = new Floods(await request.server.methods.flood.getFloods())
      model = new ViewModel({ location, place, floods, station })
      return h.view('alerts-and-warnings', { model })
    } else {
      try {
        [place] = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        request.logger.warn({
          situation: `Location search error: [${error.name}] [${error.message}]`,
          stack: error.stack
        })
        const floods = new Floods(await request.server.methods.flood.getFloods())
        model = new ViewModel({ location, place, floods, station, error })
        return h.view('alerts-and-warnings', { model })
      }

      if (!place) {
        model = new ViewModel({ location, place, floods, station })
        return h.view('alerts-and-warnings', { model })
      }

      if (typeof place === 'undefined' || !place.isEngland.is_england) {
        // If no place return empty floods
        model = new ViewModel({ location, place, floods, station })
        return h.view('alerts-and-warnings', { model })
      } else {
        // Data passed to floods model so the schema is the same as cached floods
        const data = await request.server.methods.flood.getFloodsWithin(place.bbox2k)
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
      failAction: (request, h, _err) => {
        return h.view('alerts-and-warnings').takeover()
      }
    }
  }
}]
