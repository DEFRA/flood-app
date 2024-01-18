const joi = require('@hapi/joi')
const OutlookModel = require('../models/outlook')
const FloodsModel = require('../models/floods')
const ViewModel = require('../models/views/national')

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
      return h.redirect(`/location?q=${encodeURIComponent(location)}`)
    },
    options: {
      validate: {
        payload: joi.object({
          location: joi.string().required().trim().allow('').max(190).truncate()
        })
      }
    }
  }
]
