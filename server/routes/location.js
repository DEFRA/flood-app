const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const OutlookTabsModel = require('../models/outlook-tabs')
const formatDate = require('../util').formatDate
const moment = require('moment-timezone')
const tz = 'Europe/London'

function rejectWithoutBingSearch (searchTerm) {
  const mustNotMatch = /[<>]|^scotland$|^ireland$|^wales$|^united kingdom$|^northern ireland$/i
  const mustMatch = /[a-zA-Z0-9]/
  return searchTerm.match(mustNotMatch) || !searchTerm.match(mustMatch)
}

module.exports = {
  method: 'GET',
  path: '/location',
  handler: async (request, h) => {
    const location = request.query.q || request.query.location

    if (location.match(/^england$/i)) {
      return h.redirect('/')
    }

    if (rejectWithoutBingSearch(location)) {
      return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location })
    }

    const [place] = await request.server.methods.location.find(location)

    if (!place?.name) {
      return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location })
    }

    if (!place.isEngland.is_england) {
      request.logger.warn({
        situation: 'Location search error: Valid response but location not in England.'
      })
      return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location })
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
  },
  options: {
    validate: {
      query: joi.object({
        q: joi.string().trim().max(200),
        location: joi.string().trim().max(200),
        cz: joi.string(),
        l: joi.string(),
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      }).or('q', 'location'), // q or location must be present in request.query
      failAction: (request, h) => {
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
    }
  }
}

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
