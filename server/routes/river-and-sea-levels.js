const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/river-and-sea-levels')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')

const joiParams = joi.object({
  q: joi.string().allow('').trim().max(200),
  'river-id': joi.string(),
  'target-area': joi.string(),
  type: joi.string().allow('ri', 'c', 'g', 'ra'),
  btn: joi.string(),
  ext: joi.string(),
  fid: joi.string(),
  lyr: joi.string(),
  v: joi.string()
})

module.exports = [{
  method: 'GET',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const { q: location } = request.query
    let model, place, stations
    // If river-id provided show the river
    if (request.query['river-id']) {
      const riverId = request.query['river-id']
      const stations = await floodService.getRiverById(riverId)
      model = new ViewModel({ location, place, stations, riverId })
      return h.view('river-and-sea-levels', { model })
      // Else target-area
    } else if (request.query['target-area']) {
      const { stations, targetArea } = await floodService.getStationsWithinTargetArea(request.query['target-area'])
      model = new ViewModel({ location, place, stations, targetArea })
      return h.view('river-and-sea-levels', { model })
      // Else no location
    } else if (typeof location === 'undefined' || location === '' || location.match(/^england$/i)) {
      stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])
      model = new ViewModel({ location, place, stations })
      return h.view('river-and-sea-levels', { model })
    } else {
      // Else get place from location
      try {
        place = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        console.error(`Location search error: [${error.name}] [${error.message}]`)
        if (error instanceof LocationNotFoundError) {
          // No location found so display zero results
          stations = []
          model = new ViewModel({ location, place, stations })
        } else {
          // If location search error show national list with error
          stations = await floodService.getStationsWithin([-6.73, 49.36, 2.85, 55.8])
          model = new ViewModel({ location, place, stations, error })
        }
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
        stations = await floodService.getStationsWithin(place.bbox10k)
        model = new ViewModel({ location, place, stations })
        model.referer = request.headers.referer
        return h.view('river-and-sea-levels', { model })
      }
    }
  },
  options: {
    validate: {
      query: joiParams,
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
}, {
  method: 'POST',
  path: '/river-and-sea-levels.json',
  handler: async (request, h) => {
    return ''
  },
  options: {
    validate: {
      payload: joiParams,
      failAction: (request, h, err) => {
        // TODO: is this the correct boom func
        return boom.badImplementation(err)
      }
    }
  }
}]
