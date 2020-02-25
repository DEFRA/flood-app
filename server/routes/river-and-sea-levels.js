const joi = require('@hapi/joi')
const ViewModel = require('../models/views/river-and-sea-levels')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')

module.exports = [{
  method: 'GET',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { q: location } = request.query
    var model, place, stations

    if (typeof location === 'undefined' || location === '') {
      stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])
      model = new ViewModel({ location, place, stations })
      model.referer = request.headers.referer
      return h.view('river-and-sea-levels', { model })
    } else {
      try {
        place = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])
        model = new ViewModel({ location, place, stations, error })
        model.referer = request.headers.referer
        return h.view('river-and-sea-levels', { model })
      }
    }
    if (typeof place === 'undefined') {
      // If no place return empty stations
      model = new ViewModel({ location, place, stations })
      model.referer = request.headers.referer
      return h.view('river-and-sea-levels', { model })
    } else if (!place.isEngland.is_england) {
      // Place ok but not in England
      return h.view('location-not-england')
    } else {
      stations = await floodService.getStationsWithin(place.bbox)
      model = new ViewModel({ location, place, stations })
      model.referer = request.headers.referer
      return h.view('river-and-sea-levels', { model })
    }
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().allow(''),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
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
    if (location === '') {
      return h.redirect(`/river-and-sea-levels?q=${location}`)
    }
    return h.redirect(`/river-and-sea-levels?q=${encodeURIComponent(util.cleanseLocation(location))}`)
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().allow('').trim().max(200).required()
      }),
      failAction: (request, h, err) => {
        return h.view('river-and-sea-levels').takeover()
      }
    }
  }
}]
