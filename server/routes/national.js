const OutlookModel = require('../models/outlook')
const FloodsModel = require('../models/floods')
const ViewModel = require('../models/views/national')
const joi = require('@hapi/joi')

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

function customValidator (value, helpers) {
  if (value.trim() === 'England') {
    return helpers.error('string can not be England')
  }
  return value
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
      return h.redirect(`/location?q=${encodeURIComponent(location)}`)
    },
    options: {
      validate: {
        payload: joi.object({
          location: joi
            .string()
            .custom(customValidator, 'search term check')
            .messages({
              'string.base': 'The search term must be a string',
              'string.empty': 'The search term can not be empty'
            })
        }),
        failAction: async (request, h, err) => {
          // we deliberately swallow the errors and redisplay the page
          request.logger.warn({ situation: 'location search failed validation', err })
          const model = await getModel(request, err._original.location)
          // TODO: finesse the error handling and design if we decide to use it
          // model.err = err
          return h.view('national', { model }).takeover()
        }
      }
    }
  }
]
