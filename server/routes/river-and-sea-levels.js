const joi = require('@hapi/joi')
const ViewModel = require('../models/views/river-and-sea-levels')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')
const joiParams = joi.object({
  q: joi.string().allow('').trim().max(200),
  'river-id': joi.string(),
  'target-area': joi.string(),
  types: joi.string().allow('ri', 'c', 'g', 'ra'),
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
    let { q: location, 'river-id': riverIds, 'target-area': taCode, types } = request.query
    const referer = request.headers.referer
    let model, place, stations, targetArea

    riverIds = riverIds && riverIds.split(',')

    // if we have a location query then get the place
    if (location && !location.match(/^england$/i)) {
      try {
        place = await locationService.find(util.cleanseLocation(location))
      } catch (error) {
        console.error(`Location search error: [${error.name}] [${error.message}]`)
        if (error instanceof LocationNotFoundError) {
          // No location found so display zero results
          stations = []
          model = new ViewModel({ location, place, stations, targetArea, riverIds, referer })
        } else {
          // If location search error show national list with error
          stations = await floodService.getStations()
          model = new ViewModel({ location, place, stations, targetArea, riverIds, error, referer })
        }
        return h.view('river-and-sea-levels', { model })
      }
      if ((typeof place === 'undefined') || (!place.isUK || place.isScotlandOrNorthernIreland)) {
        stations = []
        model = new ViewModel({ location, place, stations })
        return h.view('river-and-sea-levels', { model, referer })
      }
    }

    // get base stations
    stations = await getStations(place, taCode)

    // filter stations
    stations = filterStations(stations, riverIds, types)

    // optional get ta
    if (taCode) targetArea = await floodService.getTargetArea(taCode)

    // build model
    model = new ViewModel({ location, place, stations, targetArea, riverIds, referer })

    // return view
    return h.view('river-and-sea-levels', { model })
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
}
// , {
//   method: 'POST',
//   path: '/river-and-sea-levels.json',
//   handler: async (request, h) => {
//     return floodService.getStations()
//   },
//   options: {
//     validate: {
//       payload: joiParams,
//       failAction: (request, h, err) => {
//         // TODO: is this the correct boom func
//         return boom.badImplementation(err)
//       }
//     }
//   }
// }
]

const getStations = async (place, taCode) => {
  if (place) return floodService.getStationsWithin(place.bbox10k)
  if (taCode) return floodService.getStationsWithinTargetArea(taCode)
  // if no place or ta then return all stations
  return floodService.getStations()
}

const filterStations = (stations, riverIds, types) => {
  if (riverIds) stations = stations.filter(val => { return riverIds.includes(val.river_id) })
  if (types) stations = stations.filter(val => { return types.includes(val.station_type) })
  return stations
}
