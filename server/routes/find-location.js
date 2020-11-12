'use strict'

const joi = require('@hapi/joi')
const ViewModel = require('../models/views/find-location')

module.exports = [{
  method: 'GET',
  path: '/find-location',
  handler: async (request, h) => {
    const err = {}
    const location = ''
    const model = new ViewModel({ location, err })
    model.referer = request.headers.referer
    return h.view('find-location', { model })
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
        model.referer = request.headers.referer
        return h.view('find-location', { model }).takeover()
      }
    }
  }
}]
