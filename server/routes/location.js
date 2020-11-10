// const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')

module.exports = {
  method: 'GET',
  path: '/location',
  handler: async (request, h) => {
    const { q: location } = request.query

    if (!location) {
      return h.redirect('/find-location')
    }

    let place

    try {
      place = await locationService.find(util.cleanseLocation(location))
    } catch (err) {
      console.error(`Location search error: [${err.name}] [${err.message}]`)
      if (err instanceof LocationNotFoundError) {
        return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding - GOV.UK' })
      } else {
        return h.view('location-error', { pageTitle: 'Error: Find location - Check for flooding - GOV.UK' })
      }
    }

    if (!place.isEngland.is_england) {
      console.error('Location search error: Valid response but location not in England.')
      return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding - GOV.UK' })
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
    // validate: {
    //   query: joi.object({
    //     q: joi.string().trim().max(200).required(),
    //   })
    // }
  }
}
