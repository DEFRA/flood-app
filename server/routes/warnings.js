const joi = require('@hapi/joi')
const ViewModel = require('../models/views/warnings')
const Floods = require('../models/floods')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = [{
  method: 'GET',
  path: '/alerts-and-warnings',
  handler: async (request, h) => {
    const { q: location } = request.query
    var model = null
    var place = null
    if (typeof location === 'undefined' || location === '') {
      const floods = floodService.floods
      model = new ViewModel({ location, place, floods })
      model.hasBackButton = Boolean(request.headers.referer)
      return h.view('warnings', { model })
    }
    place = await locationService.find(location)
    if (typeof place === 'undefined' || place === '') {
      // Place error
      return h.view('404').code(404)
    }
    if (!place.isEngland.is_england) {
      // Place ok but not in England
      return h.view('location-not-england')
    }
    // Data passed to floods model so the schema is the same as cached floods
    const data = await floodService.getFloodsWithin(place.bbox)
    const floods = new Floods(data)
    model = new ViewModel({ location, place, floods })
    model.hasBackButton = Boolean(request.headers.referer)
    return h.view('warnings', { model })
  },
  options: {
    validate: {
      query: {
        q: joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      }
    }
  }
}, {
  method: 'POST',
  path: '/alerts-and-warnings',
  handler: async (request, h) => {
    const { location } = request.payload
    const { q } = request.query
    var model = null
    var place = null
    if (typeof location === 'undefined' || location === '') {
      const floods = floodService.floods
      model = new ViewModel({ location, place, floods })
      model.hasBackButton = Boolean(request.headers.referer)
      return h.redirect('/alerts-and-warnings')
    }
    place = await locationService.find(location)
    if (typeof place === 'undefined' || place === '') {
      return h.redirect(`/alerts-and-warnings${q ? '?q=' + q : ''}`)
    }
    // Data passed to floods model so the schema is the same as cached floods
    const data = await floodService.getFloodsWithin(place.bbox)
    const floods = new Floods(data)
    model = new ViewModel({ location, place, floods })
    model.hasBackButton = Boolean(request.headers.referer)
    return h.redirect(`/alerts-and-warnings?q=${location}`)
  }
}]
