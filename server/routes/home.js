'use strict'

const joi = require('@hapi/joi')

module.exports = [{
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
    return h.view('home')
  }
}, {
  method: 'POST',
  path: '/',
  handler: async (request, h) => {
    const { location } = request.payload
    return h.redirect(`/location?q=${location}`)
  },
  options: {
    validate: {
      payload: joi.object({
        location: joi.string().required()
      }),
      failAction: (request, h, err) => {
        return h.view('home', { errorMessage: 'Enter a valid location' }).takeover()
      }
    }
  }
}]
