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
      return h.redirect('/')
    }
    if (!place.isEngland.is_england) {
      return h.redirect('/location-not-england')
    }
    const stations = await floodService.getStationsWithin(place.bbox)
    const model = new ViewModel({ location, place, stations })
    return h.view('levels', { model })
  },
  options: {
    validate: {
      query: {
        q: joi.string().required(),
        cz: joi.string(),
        l: joi.string(),
        v: joi.string()
      }
    }
  }
}
