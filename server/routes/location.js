const joi = require('joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/location')
const OutlookPolys = require('../models/outlook-polys')
const Outlook = require('../models/outlook')
const locationService = require('../services/location')
const moment = require('moment-timezone')
const tz = 'Europe/London'
const qs = require('qs')

function createQueryParametersString (queryObject) {
  const { q, location, ...otherParameters } = queryObject
  const queryString = qs.stringify(otherParameters, { addQueryPrefix: true, encode: false })
  return queryString
}

async function legacyRouteHandler (request, h) {
  const location = request.query.q || request.query.location
  const [place] = await locationService.find(location)
  const queryString = createQueryParametersString(request.query)
  if (place) {
    return h.redirect(`/location/${place?.slug}${queryString}`).permanent()
  }
  return boom.notFound(`Location ${location} not found`)
}

async function routeHandler (request, h) {
  const { location } = request.params
  if (location.match(/^england$/i)) {
    return h.redirect('/')
  }

  const [place] = await locationService.get(location)

  if (!place) {
    return boom.notFound(`Location ${location} not found`)
  }

  if (!place.isEngland.is_england) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })
    return boom.notFound(`Location ${location} not found`)
  }

  const { messageIds, outOfDate, dataError, outlookDays, outlookData } = await createOutlookMessageIds(place, request)

  const [
    impacts,
    { floods },
    stations
  ] = await Promise.all([
    request.server.methods.flood.getImpactsWithin(place.bbox2k),
    request.server.methods.flood.getFloodsWithin(place.bbox2k),
    request.server.methods.flood.getStationsWithin(place.bbox10k)
  ])
  const model = new ViewModel({ location, place, floods, stations, impacts, messageIds, outOfDate, dataError, outlookDays, outlookData })
  return h.view('location', { model })
}

const failActionHandler = (request, h) => {
  request.logger.warn({
    situation: 'Location search error: Invalid or no string input.'
  })
  const location = request.query.q || request.query.location
  if (!location) {
    return h.redirect('/').takeover()
  } else {
    return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location }).takeover()
  }
}

const queryValidation = {
  cz: joi.string(),
  l: joi.string(),
  btn: joi.string(),
  ext: joi.string(),
  fid: joi.string(),
  lyr: joi.string(),
  v: joi.string()
}

module.exports = [{
  method: 'GET',
  path: '/location',
  handler: legacyRouteHandler,
  options: {
    validate: {
      query: joi
        .object({ location: joi.string(), q: joi.string(), ...queryValidation })
        .or('q', 'location'),
      failAction: failActionHandler
    }
  }
}, {
  method: 'GET',
  path: '/location/{location}',
  handler: routeHandler,
  options: {
    validate: {
      params: joi.object({
        location: joi.string().lowercase()
      }),
      query: joi.object(queryValidation),
      failAction: failActionHandler
    }
  }
}]

const createOutlookMessageIds = async (place, request) => {
  let messageIds = []
  let outOfDate = true
  let outlookDays = []
  let outlookData = null
  const now = moment().tz(tz).valueOf()
  const hours48 = 2 * 60 * 60 * 24 * 1000
  let issueDate = moment().valueOf() // Default issueDate to today

  let {
    outlook,
    dataError
  } = await getOutlook(request)

  if (outlook && Object.keys(outlook).length > 0 && !dataError) {
    if (!outlook.issued_at) {
      request.logger.warn({
        situation: `Outlook FGS issued_at date error [${outlook.issued_at}]`
      })
      dataError = true
    } else {
      issueDate = moment(outlook.issued_at).valueOf()

      outOfDate = (now - issueDate) > hours48

      const riskAreasCount = outlook.risk_areas ? outlook.risk_areas.length : 0

      const outlookPolys = new OutlookPolys(outlook, place)
      messageIds = outOfDate || riskAreasCount === 0 ? [] : outlookPolys.messageIds

      // Create full outlook instance for map data
      const outlookInstance = new Outlook(outlook, request.logger)
      if (!outlookInstance.dataError) {
        outlookDays = outlookInstance.days
        outlookData = outlookInstance.geoJson
      }
    }
  }
  return { messageIds, outOfDate, dataError, outlookDays, outlookData }
}

const getOutlook = async request => {
  let outlook = {}
  let dataError = false
  try {
    outlook = await request.server.methods.flood.getOutlook()
  } catch (err) {
    request.logger.warn({
      situation: 'Outlook FGS data error',
      err
    })
    dataError = true
  }
  return {
    outlook,
    dataError
  }
}
