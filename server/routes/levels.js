const joi = require('@hapi/joi')
const ViewModel = require('../models/views/levels')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = {
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
        e: joi.string(),
        f: joi.string(),
        l: joi.string(),
        v: joi.string()
      }
    }
  }
}
