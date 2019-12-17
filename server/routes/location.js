const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const displayErrors = require('../models/display-error')

module.exports = {
  method: 'GET',
  path: '/location',
  handler: async (request, h) => {
    const { q: location } = request.query
    let place
    try {
      place = await locationService.find(location)
    } catch (err) {
      console.error(err)
      request.yar.set('displayError', displayErrors['location-services-error'])
      return h.redirect('/')
    }
    if (!place) {
      request.yar.set('displayError', displayErrors['invalid-location'])
      return h.redirect('/')
    }
    if (!place.isEngland.is_england) {
      request.yar.set('displayError', displayErrors['location-not-england'])
      return h.redirect('/')
    }
    const impacts = await floodService.getImpactsWithin(place.bbox)
    const { floods } = await floodService.getFloodsWithin(place.bbox)
    const stations = await floodService.getStationsWithin(place.bbox)
    const model = new ViewModel({ location, place, floods, stations, impacts })
    return h.view('location', { model })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().required(),
        cz: joi.string(),
        l: joi.string(),
        v: joi.string()
      })
    }
  }
}
