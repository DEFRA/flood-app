const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/location')
const OutlookTabsModel = require('../models/outlook-tabs')
const locationService = require('../services/location')
const formatDate = require('../util').formatDate
const moment = require('moment-timezone')
const tz = 'Europe/London'
const { slugify } = require('./lib/utils')
const qs = require('qs')

function createQueryParametersString (queryObject) {
  const { q, ...otherParameters } = queryObject
  // otherParameters has all parameters except q
  const queryString = qs.stringify(otherParameters, { addQueryPrefix: true, encode: false })
  return queryString
}

async function legacyRouteHandler (request, h) {
  const location = request.query.q
  const [place] = await locationService.find(location)
  const queryString = createQueryParametersString(request.query)
  if (place) {
    return h.redirect(`/location/${slugify(place?.name)}${queryString}`).permanent()
  }
  return boom.notFound(`Location ${location} not found`)
}

async function routeHandler (request, h) {
  const { location } = request.params
  if (location.match(/^england$/i)) {
    return h.redirect('/')
  }

  const [place] = await locationService.find(location)

  if (slugify(place?.name) !== location) {
    return boom.notFound(`Location ${location} not found`)
  }

  if (!place.isEngland.is_england) {
    request.logger.warn({
      situation: 'Location search error: Valid response but location not in England.'
    })
    return boom.notFound(`Location ${location} not found`)
  }

  const { tabs, outOfDate, dataError } = await createOutlookTabs(place, request)

  const [
    impacts,
    { floods },
    stations
  ] = await Promise.all([
    request.server.methods.flood.getImpactsWithin(place.bbox2k),
    request.server.methods.flood.getFloodsWithin(place.bbox2k),
    request.server.methods.flood.getStationsWithin(place.bbox10k)
  ])
  const model = new ViewModel({ location, place, floods, stations, impacts, tabs, outOfDate, dataError })
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
      query: joi.object({ q: joi.string().required(), ...queryValidation }),
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

const createOutlookTabs = async (place, request) => {
  let tabs = {}
  let outOfDate = true
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

      const outlookTabsModel = new OutlookTabsModel(outlook, place)
      tabs = outOfDate || riskAreasCount === 0 ? { lowForFive: true } : outlookTabsModel

      if (riskAreasCount === 0) {
        tabs.formattedIssueDate = `${formatDate(outlook.issued_at, 'h:mma')} on ${formatDate(outlook.issued_at, 'D MMMM YYYY')}`
        tabs.issueUTC = moment(outlook.issued_at).tz('Europe/London').format()
      }
    }
  }
  return { tabs, outOfDate, dataError }
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
