const joi = require('@hapi/joi')
const ViewModel = require('../models/views/levels')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = [{
  method: 'GET',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { q: location } = request.query
    const place = await locationService.find(location)
    if (typeof place === 'undefined' || place === '') {
      request.yar.set('displayError', { errorMessage: 'Enter a valid location' })
      return h.view('404').code(404)
    }
    if (!place.isEngland.is_england) {
      return h.view('location-not-england')
    }
    const stations = await floodService.getStationsWithin(place.bbox)
    var model = new ViewModel({ location, place, stations })
    model.hasBackButton = Boolean(request.headers.referer)
    return h.view('levels', { model })
  },
  options: {
    validate: {
      query: {
        q: joi.string().required(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      },
      failAction: (request, h, err) => {
        return h.view('404').code(404)
      }
    }
  }
}, {
  method: 'POST',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { location } = request.payload
    const place = await locationService.find(location)
    if (typeof place === 'undefined' || place === '') {
      request.yar.set('displayError', { errorMessage: 'Enter a valid location' })
      return h.view('404').code(404)
    }
    if (!place.isEngland.is_england) {
      return h.view('location-not-england')
    }
    const stations = await floodService.getStationsWithin(place.bbox)
    var model = new ViewModel({ location, place, stations })
    model.hasBackButton = Boolean(request.headers.referer)
    return h.view('levels', { model })
  },
  options: {
    validate: {
      payload: {
        location: joi.string().required()
      },
      failAction: (request, h, err) => {
        return h.view('levels', { errorMessage: 'Enter a valid location' }).takeover()
      }
    }
  }
}]
