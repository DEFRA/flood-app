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
    let model, place, stations
    // If river-id provided show the river
    if (request.query['river-id']) {
      const stations = await floodService.getRiverById(request.query['river-id'])
      model = new ViewModel({ location, place, stations })
      return h.view('river-and-sea-levels', { model })
      // Else target-area
    } else if (request.query['target-area']) {
      const bbox = await floodService.getStationsWithinTargetArea(request.query['target-area'])
      const bboxExtended = util.addBufferToBbox([bbox[0].x1, bbox[0].y1, bbox[0].x2, bbox[0].y2], 8000)
      stations = await floodService.getStationsWithin(bboxExtended)
      const targetArea = {
        name: bbox[0].ta_name,
        description: bbox[0].ta_name
      }
      model = new ViewModel({ location, place, stations, targetArea })
      return h.view('river-and-sea-levels', { model })
      // Else no location
    } else if (typeof location === 'undefined' || location === '') {
      stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])
      model = new ViewModel({ location, place, stations })
      return h.view('river-and-sea-levels', { model })
    } else {
      // Else get place from location
      try {
        place = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        // If location search error show national list with error
        stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])
        model = new ViewModel({ location, place, stations, error })
        return h.view('river-and-sea-levels', { model })
      }
      // If no place found or not UK or Scotland and Northern Ireland
      if ((typeof place === 'undefined') || (!place.isUK || place.isScotlandOrNorthernIreland)) {
        stations = []
        model = new ViewModel({ location, place, stations })
        model.referer = request.headers.referer
        return h.view('river-and-sea-levels', { model })
      } else {
        // Finally show place filtered station list
        stations = await floodService.getStationsWithin(place.bbox)
        model = new ViewModel({ location, place, stations })
        model.referer = request.headers.referer
        return h.view('river-and-sea-levels', { model })
      }
    }
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().allow('').trim().max(200),
        'river-id': joi.string(),
        'target-area': joi.string(),
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
