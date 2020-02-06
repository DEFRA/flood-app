const joi = require('@hapi/joi')
const ViewModel = require('../models/views/river-and-sea-levels')
const RiverViewModel = require('../models/views/river-stations')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')

module.exports = [{
  method: 'GET',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { type } = request.query
    let { q: location } = request.query

    let model, place, stations

    if (type === 'location') {
      place = await locationService.find(util.cleanseLocation(location))

      if (typeof place === 'undefined' || place === '') {
        model = new ViewModel({ location, place, stations, type })
        model.referer = request.headers.referer
        return h.view('river-and-sea-levels', { model })
      }
      if (!place.isEngland.is_england) {
        return h.view('location-not-england')
      }

      stations = await floodService.getStationsWithin(place.bbox)

      model = new ViewModel({ location, place, stations, type })
      model.referer = request.headers.referer

      return h.view('river-and-sea-levels', { model })
    } else if (type === 'river') {
      location = util.cleanseLocation(location)

      const rivers = floodService.rivers
      const isRiver = rivers.some(obj => obj === location)

      if (isRiver === false || location === '') {
        model = new ViewModel({ location, place, stations, type })
        model.referer = request.headers.referer
        return h.view('river-and-sea-levels', { model })
      }
      stations = await floodService.getStationsByRiver(util.cleanseLocation(location))

      model = new RiverViewModel({ location, place, stations, type })
      model.referer = request.headers.referer

      return h.view('river-and-sea-levels', { model })
    } else {
      // getStationsWithin needs changing
      stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])

      model = new ViewModel({ location, place, stations, type })
      model.referer = request.headers.referer

      return h.view('river-and-sea-levels', { model })
    }
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
        type: joi.string().valid('location', 'river')
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
    const { location, river } = request.payload
    const searchType = request.payload['search-type']

    if (searchType === 'location') {
      if (typeof location === 'undefined' || location === '') {
        return h.redirect('/river-and-sea-levels')
      }
      return h.redirect(`/river-and-sea-levels?q=${location}&type=location`)
    } else if (searchType === 'river') {
      if (typeof river === 'undefined' || river === '') {
        return h.redirect('/river-and-sea-levels')
      }
      return h.redirect(`/river-and-sea-levels?q=${river}&type=river`)
    } else {
      return h.redirect('/river-and-sea-levels')
    }
  }
}]
