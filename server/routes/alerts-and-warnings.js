const joi = require('@hapi/joi')
const ViewModel = require('../models/views/alerts-and-warnings')
const Floods = require('../models/floods')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')

module.exports = [{
  method: 'GET',
  path: '/alerts-and-warnings',
  handler: async (request, h) => {
    const { q: location } = request.query
    var model, place, floods

    if (typeof location === 'undefined' || location === '') {
      const floods = floodService.floods
      model = new ViewModel({ location, place, floods })
      model.referer = request.headers.referer
      return h.view('alerts-and-warnings', { model })
    } else {
      try {
        place = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        const floods = floodService.floods
        model = new ViewModel({ location, place, floods, error })
        model.referer = request.headers.referer
        return h.view('alerts-and-warnings', { model })
      }
      if (typeof place === 'undefined') {
        // If no place return empty floods
        model = new ViewModel({ location, place, floods })
        model.referer = request.headers.referer
        return h.view('alerts-and-warnings', { model })
      } else if (!place.isEngland.is_england) {
        // Place ok but not in England
        return h.view('location-not-england')
      } else {
        // Data passed to floods model so the schema is the same as cached floods
        const data = await floodService.getFloodsWithin(place.bbox)
        floods = new Floods(data)
        model = new ViewModel({ location, place, floods })
        model.referer = request.headers.referer
        return h.view('alerts-and-warnings', { model })
      }
    }
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().allow(''),
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
