const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = {
  method: 'GET',
  path: '/location',
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
    const impacts = await floodService.getImpactsWithin(place.bbox)
    const { floods } = await floodService.getFloodsWithin(place.bbox)
    const stations = await floodService.getStationsWithin(place.bbox)
    const model = new ViewModel({ place, floods, stations, impacts })
    return h.view('location', { model })
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