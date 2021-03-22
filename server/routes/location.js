const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const OutlookTabsModel = require('../models/outlook-tabs')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')
const moment = require('moment-timezone')
const tz = 'Europe/London'

module.exports = {
  method: 'GET',
  path: '/location',
  handler: async (request, h) => {
    const { q: location } = request.query

    let place

    if (location.match(/^england$/i)) {
      return h.redirect('/')
    }

    try {
      place = await locationService.find(util.cleanseLocation(location))
    } catch (err) {
      console.error(`Location search error: [${err.name}] [${err.message}]`)
      if (err instanceof LocationNotFoundError) {
        return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location: location })
      } else {
        return h.view('location-error', { pageTitle: 'Sorry, there is a problem with the service - Check for flooding', location: location })
      }
    }

    if (!place.isEngland.is_england) {
      console.error('Location search error: Valid response but location not in England.')
      return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location: location })
    }

    const outlook = await floodService.getOutlook()

    const issueDate = moment(outlook.issued_at).valueOf()
    const now = moment().tz(tz).valueOf()
    const hours48 = 2 * 60 * 60 * 24 * 1000
    const outOfDate = (now - issueDate) > hours48

    const riskAreasCount = outlook.risk_areas ? outlook.risk_areas.length : 0
    const tabs = outOfDate || riskAreasCount === 0 ? {} : new OutlookTabsModel(outlook, place)

    const [
      impacts,
      { floods },
      stations
    ] = await Promise.all([
      floodService.getImpactsWithin(place.bbox2k),
      floodService.getFloodsWithin(place.bbox2k),
      floodService.getStationsWithin(place.bbox10k)
    ])
    const model = new ViewModel({ location, place, floods, stations, impacts, tabs, outOfDate })
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
        v: joi.string()
      }),
      failAction: (request, h, err) => {
        console.error('Location search error: Invalid or no string input.')
        if (!request.query.q) {
          return h.redirect('/find-location').takeover()
        } else {
          return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location: request.query.q }).takeover()
        }
      }
    }
  }
}
