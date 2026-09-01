const joi = require('joi')

const { COORDINATE_PATTERN } = require('../constants')
const OutlookModel = require('../models/outlook')
const FloodsModel = require('../models/floods')
const ViewModel = require('../models/views/national')
const locationService = require('../services/location')

async function getModel (request, location) {
  const floods = new FloodsModel(await request.server.methods.flood.getFloods())

  let outlook = {}
  try {
    outlook = new OutlookModel(await request.server.methods.flood.getOutlook(), request.logger)
  } catch (err) {
    request.logger.warn({
      situation: 'outlook error',
      err
    })
    outlook.dataError = true
  }

  return new ViewModel(floods, outlook, location)
}

function rejectedLocation (location, geolocation) {
  return (!geolocation && (location.toLowerCase() === 'england' || location === ''))
}

function isGeolocationError (location, geolocation, error) {
  return Boolean(error && !geolocation && location === '')
}

function getMessageText (geolocationError) {
  return geolocationError
    ? 'Turn on location services to use your current location, or enter a town, city or postcode in England'
    : ''
}

function getRedirectPath (place, geolocation) {
  if (geolocation) {
    return place?.isEngland?.is_england
      ? '/location/' + encodeURIComponent(place?.slug)
      : '/outside-england'
  }

  return place?.isEngland?.is_england
    ? '/location/' + encodeURIComponent(place?.slug)
    : null
}

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: async function (request, h) {
      const model = await getModel(request)

      return h.view('national', { model })
    }
  },
  {
    method: 'POST',
    path: '/',
    handler: async function (request, h) {
      const { location, error = null, geolocation = null } = request.payload
      const geolocationError = isGeolocationError(location, geolocation, error)
      const messageText = getMessageText(geolocationError)

      if (rejectedLocation(location, geolocation)) {
        const model = await getModel(request, location)
        if (geolocationError) {
          model.errorMessage = messageText
          model.pageTitle = `Error: ${messageText}`
        }
        return h.view('national', { model })
      }

      const [place] = await locationService.find(geolocation || location)
      const redirect = getRedirectPath(place, geolocation)

      if (redirect) {
        return h.redirect(redirect)
      }

      return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location, messageText })
    },
    options: {
      validate: {
        payload: joi.object({
          location: joi.string().required().trim().allow(''),
          geolocation: joi.string().optional().trim().allow('').pattern(COORDINATE_PATTERN),
          error: joi.string().optional().trim().allow('')
        })
      }
    }
  }
]
