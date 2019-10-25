const joi = require('@hapi/joi')
const ViewModel = require('../models/views/levels')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = [{
  method: 'GET',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { q: location } = request.query
    var model, place, stations
    place = await locationService.find(location)
    if (typeof place === 'undefined' || place === '') {
      stations = floodService.stations
      model = new ViewModel({ location, place, stations })
      model.hasBackButton = Boolean(request.headers.referer)
      return h.view('levels', { model })
    }
    if (!place.isEngland.is_england) {
      return h.view('location-not-england')
    }
    stations = await floodService.getStationsWithin(place.bbox)
    model = new ViewModel({ location, place, stations })
    model.hasBackButton = Boolean(request.headers.referer)
    return h.view('levels', { model })
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
      },
      failAction: (request, h, err) => {
        console.log('Fail action')
        return h.view('404').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { location } = request.payload
    if (typeof location === 'undefined' || location === '') {
      return h.redirect('/river-and-sea-levels')
    }
    return h.redirect(`/river-and-sea-levels?q=${location}`)
  }
}]
