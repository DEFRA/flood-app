const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const displayErrors = require('../models/display-error')
const util = require('../util')

module.exports = {
  method: 'GET',
  path: '/location',
  handler: async (request, h) => {
    const { q: location } = request.query
    let place
    try {
      place = await locationService.find(util.cleanseLocation(location))
    } catch (err) {
      console.error(err)
      request.yar.set('displayError', displayErrors['location-services-error'])
      return h.redirect('/find-location')
    }
    if (!place) {
      request.yar.set('displayError', displayErrors['invalid-location'])
      request.yar.set('locationError', { input: location })
      return h.redirect('/find-location')
    }
    if (!place.isEngland.is_england) {
      return h.view('location-not-england')
    }
    const [
      impacts,
      { floods },
      stations
    ] = await Promise.all([
      floodService.getImpactsWithin(place.bbox),
      floodService.getFloodsWithin(place.bbox),
      floodService.getStationsWithin(place.bbox)
    ])
    const model = new ViewModel({ location, place, floods, stations, impacts })
    return h.view('location', { model })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().trim().max(200).required(),
        cz: joi.string(),
        l: joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string(),
        b: joi.string() // Remove in prod
      })
    }
  }
}
