const joi = require('@hapi/joi')
const ViewModel = require('../models/views/impacts')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = [{
  method: 'GET',
  path: '/historic-impacts',
  handler: async (request, h) => {
    const { q: location } = request.query
    var model, place, impacts
    place = await locationService.find(location)
    if (typeof place === 'undefined' || place === '') {
      impacts = []
      model = new ViewModel({ location, place, impacts })
      model.hasBackButton = Boolean(request.headers.referer)
      return h.view('impacts', { model })
    }
    if (!place.isEngland.is_england) {
      return h.view('location-not-england')
    }
    impacts = await floodService.getImpactsWithin(place.bbox)
    model = new ViewModel({ location, place, impacts })
    model.hasBackButton = Boolean(request.headers.referer)
    return h.view('impacts', { model })
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
        return h.view('404').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/historic-impacts',
  handler: async (request, h) => {
    const { location } = request.payload
    if (typeof location === 'undefined' || location === '') {
      return h.redirect('/historic-impacts')
    }
    return h.redirect(`/historic-impacts?q=${location}`)
  }
}]
