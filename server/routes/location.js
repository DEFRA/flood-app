const joi = require('joi')
const ViewModel = require('../models/views/location')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = {
  method: 'GET',
  path: '/location',
  handler: async (request, h) => {
    const { q: location } = request.query
    const place = await locationService.find(location)
    if (typeof place === 'undefined') {
      request.yar.set('displayError', { errorMessage: 'No results match your search term. Please try again.' })
      return h.redirect('/')
    }
    if (!place.isEngland.is_england) {
      return h.redirect('/location-not-england')
    }
    const { floods } = await floodService.getFloodsWithin(place.bbox)
    const stations = await floodService.getStationsWithin(place.bbox)
    const model = new ViewModel({ place, floods, stations })

    return h.view('location', { model })
  },
  options: {
    validate: {
      query: {
        q: joi.string().required()
      }
    }
  }
}
