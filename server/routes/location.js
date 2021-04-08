const joi = require('@hapi/joi')
const ViewModel = require('../models/views/location')
const OutlookTabsModel = require('../models/outlook-tabs')
const floodService = require('../services/flood')
const locationService = require('../services/location')
const util = require('../util')
const LocationNotFoundError = require('../location-not-found-error')
const formatDate = require('../util').formatDate
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

    const { tabs, outOfDate, dataError } = await createOutlookTabs(place)

    const [
      impacts,
      { floods },
      stations
    ] = await Promise.all([
      floodService.getImpactsWithin(place.bbox2k),
      floodService.getFloodsWithin(place.bbox2k),
      floodService.getStationsWithin(place.bbox10k)
    ])
    const model = new ViewModel({ location, place, floods, stations, impacts, tabs, outOfDate, dataError })
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

const createOutlookTabs = async place => {
  let tabs = {}
  let outOfDate = true
  let dataError = false
  let myOutlook = {}
  const now = moment().tz(tz).valueOf()
  const hours48 = 2 * 60 * 60 * 24 * 1000
  let issueDate = moment().valueOf() // Default issueDate to today
  let cachedOutlook = {}

  try {
    cachedOutlook = await floodService.outlook
    if (cachedOutlook && cachedOutlook._outlook) {
      myOutlook = JSON.parse(JSON.stringify(cachedOutlook._outlook))
    } else {
      dataError = true
    }
  } catch (err) {
    console.error(`Outlook FGS data error [${myOutlook}]`)
    dataError = true
  }

  if (!dataError) {
    if (!myOutlook.issued_at) {
      console.error(`Outlook FGS issued_at date error [${myOutlook.issued_at}]`)
      dataError = true
    } else {
      issueDate = moment(myOutlook.issued_at).valueOf()
    }

    outOfDate = (now - issueDate) > hours48

    const riskAreasCount = myOutlook.risk_areas ? myOutlook.risk_areas.length : 0

    const outlookTabsModel = new OutlookTabsModel(myOutlook, place)
    tabs = outOfDate || riskAreasCount === 0 ? { lowForFive: true } : outlookTabsModel

    if (riskAreasCount === 0) {
      tabs.formattedIssueDate = `${formatDate(myOutlook.issued_at, 'h:mma')} on ${formatDate(myOutlook.issued_at, 'D MMMM YYYY')}`
      tabs.issueUTC = moment(myOutlook.issued_at).tz('Europe/London').format()
    }
  }
  return { tabs, outOfDate, dataError }
}
