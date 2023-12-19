const OutlookModel = require('../models/outlook')
const FloodsModel = require('../models/floods')
const ViewModel = require('../models/views/national')
const joi = require('@hapi/joi')

module.exports = [{
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
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

    const model = new ViewModel(floods, outlook)

    return h.view('national', { model })
  }
}, {
  method: 'POST',
  path: '/',
  handler: async (request, h) => {
    const { location } = request.payload
    if (location) {
      return h.redirect(`/location?q=${encodeURIComponent(location)}`)
    }
    //  TODO: decide if we need to use redirect or view here. Would need to extract the model building in GET to a method
    return h.redirect('/')
  },
  options: {
    validate: {
      payload: joi.object({
        // TODO: check list of allowed characters
        location: joi.string().allow('').regex(/^[ a-zA-Z0-9-!]+$/).min(2).required()
      }),
      failAction: (request, h, err) => {
        request.logger.warn({ situation: 'location search failed validation', err })
        // const model = new ViewModel({ err })
        // model.referer = request.headers.referer
        // return h.view('/', { model }).takeover()
      }
    }
  }
}]
