'use strict'

const joi = require('@hapi/joi')
const ViewModel = require('../models/views/find-location')

module.exports = [{
  method: 'GET',
  path: '/find-location',
  handler: async (request, h) => {
    if (typeof request.yar === 'undefined' ||
    request.yar.get('displayError') === null ||
    request.yar.get('displayError') === {}) {
      const err = {}
      const location = ''
      const model = new ViewModel({ location, err })
      return h.view('find-location', { model })
    } else {
      const err = request.yar.get('displayError')
      request.yar.set('displayError', {})
      const location = request.yar.get('locationError').input
      request.yar.set('locationError', {})
      const model = new ViewModel({ location, err })
      return h.view('find-location', { model })
    }
  }
}, {
  method: 'POST',
  path: '/find-location',
  handler: async (request, h) => {
    const { location } = request.payload
    return h.redirect(`/location?q=${encodeURIComponent(location)}`)
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().required()
      }),
      failAction: (request, h, err) => {
        const model = new ViewModel({ err })
        return h.view('find-location', { model }).takeover()
      }
    }
  }
}]
