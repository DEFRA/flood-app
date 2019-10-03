const joi = require('@hapi/joi')
const ViewModel = require('../models/views/impacts')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = {
  method: 'GET',
  path: '/historic-impacts',
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
    const model = new ViewModel({ location, place, impacts })
    return h.view('impacts', { model })
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
