const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const OutlookTabsModel = require('../models/outlookTabs')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')
const turf = require('@turf/turf')

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

    const tabsObj = new OutlookTabsModel(outlook)

    const outlookJson = floodService.outlook.geoJson
    // console.log('JFS: outlookJson: ', JSON.stringify(outlookJson))
    const polyArr = outlookJson.features.map((feature) => {
      console.log('JFS: type: ', feature.geometry.type)
      console.log('JFS: place: ', place.bbox2k)
      if (feature.geometry.type === 'Polygon') {
        const locationCoords = turf.polygon([[
          [place.bbox2k[0], place.bbox2k[1]],
          [place.bbox2k[0], place.bbox2k[3]],
          [place.bbox2k[2], place.bbox2k[3]],
          [place.bbox2k[2], place.bbox2k[1]],
          [place.bbox2k[0], place.bbox2k[1]]
        ]])
        const featureCoords = turf.polygon(feature.geometry.coordinatesOrig)
        // console.log('JFS: feature.geometry.coordinatesOrig: ', feature.geometry.coordinatesOrig)
        // console.log('JFS: locationCoords: ', JSON.stringify(locationCoords))
        // console.log('JFS: featureCoords: ', JSON.stringify(featureCoords))
        const intersection = turf.intersect(featureCoords, locationCoords)
        console.log('JFS: intersection: ', intersection)
      }
      return feature.properties
    })
    // console.log('JFS: polyArr: ', polyArr)

    const [
      impacts,
      { floods },
      stations
    ] = await Promise.all([
      floodService.getImpactsWithin(place.bbox2k),
      floodService.getFloodsWithin(place.bbox2k),
      floodService.getStationsWithin(place.bbox10k)
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
