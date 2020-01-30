const joi = require('@hapi/joi')
const ViewModel = require('../models/views/river-and-sea-levels')
const RiverViewModel = require('../models/views/river-stations')
const floodService = require('../services/flood')
const locationService = require('../services/location')

module.exports = [{
  method: 'GET',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { q: location } = request.query
    const { type } = request.query
    var model, place, stations
    if (type === 'location') {
      place = await locationService.find(location)

      if (!place.isEngland.is_england) {
        return h.view('location-not-england')
      }
    } else {
      place = type
    }
    if (typeof place === 'undefined' || place === '') {
      stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])
      model = new ViewModel({ location, place, stations })
      model.referer = request.headers.referer
      return h.view('river-and-sea-levels', { model })
    }
    if (type === 'location') {
      stations = await floodService.getStationsWithin(place.bbox)
      console.log(stations)
      model = new ViewModel({ location, place, stations })
      model.referer = request.headers.referer
      return h.view('levels', { model })
    }
    stations = await floodService.getStationsByRiver(location)
    console.log(stations)
    model = new RiverViewModel({ location, stations })
    model.referer = request.headers.referer
    return h.view('river-and-sea-levels', { model })
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string(),
        type: joi.string()
      }),
      failAction: (request, h, err) => {
        return h.view('404').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { location } = request.payload
    const { river } = request.payload
    if (river === '') {
      if (typeof location === 'undefined' || location === '') {
        return h.redirect('/river-and-sea-levels')
      }
      return h.redirect(`/river-and-sea-levels?q=${location}&type=location`)
    } return h.redirect(`/river-and-sea-levels?q=${river}&type=river`)
  }
}]
