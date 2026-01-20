const joi = require('joi')
const OutlookModel = require('../models/forecast-outlook/outlook-map')
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

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      const model = await getModel(request)

      return h.view('national', { model })
    }
  },
  {
    method: 'POST',
    path: '/',
    handler: async (request, h) => {
      const { location } = request.payload
      if (location.toLowerCase() === 'england' || location === '') {
        const model = await getModel(request, location)
        return h.view('national', { model })
      }
      const [place] = await locationService.find(location)
      if (!place?.name || !place.isEngland.is_england) {
        return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', location })
      }
      return h.redirect(`/location/${encodeURIComponent(place?.slug)}`)
    },
    options: {
      validate: {
        payload: joi.object({
          location: joi.string().required().trim().allow('')
        })
      }
    }
  }
]
