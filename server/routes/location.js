const joi = require('joi')
const ViewModel = require('../models/views/location')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = {
  method: 'GET',
  path: '/location',
  handler: async (request, h) => {
    const { location } = request.query
    const place = await locationService.find(location)
    const { floods } = await floodService.getFloodsWithin(place.bbox)
    const model = new ViewModel({ place, floods })

    return h.view('location', { model })
  },
  options: {
    validate: {
      query: {
        location: joi.string().required()
      }
    }
  }
}
