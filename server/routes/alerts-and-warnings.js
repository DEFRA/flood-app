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
      // if !!location
      const floods = floodService.floods
      model = new ViewModel({ location, place, floods })
      model.referer = request.headers.referer
      return h.view('alerts-and-warnings', { model })
    }
    place = await locationService.find(util.cleanseLocation(location))

    if (typeof place === 'undefined' || place === '') {
      // If no place return empty floods
      model = new ViewModel({ location, place, floods })
      model.referer = request.headers.referer
      return h.view('alerts-and-warnings', { model })
    }
    if (!place.isEngland.is_england) {
      // Place ok but not in England
      return h.view('location-not-england')
    }

    // Data passed to floods model so the schema is the same as cached floods
    const data = await floodService.getFloodsWithin(place.bbox)
    floods = new Floods(data)
    model = new ViewModel({ location, place, floods })
    model.referer = request.headers.referer
    return h.view('alerts-and-warnings', { model })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string(),
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
    if (typeof location === 'undefined' || location === '') {
      return h.redirect('/alerts-and-warnings')
    }
    return h.redirect(`/alerts-and-warnings?q=${location}`)
  }
}]
