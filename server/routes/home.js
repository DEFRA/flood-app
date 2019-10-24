'use strict'

const joi = require('@hapi/joi')

module.exports = [{
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
    console.log('Get handler')
    if (typeof request.yar === 'undefined' || typeof request.yar.get('displayError') === 'undefined') {
      return h.view('home')
    } else {
      const errMess = request.yar.get('displayError')
      request.yar.set('displayError', {})
      return h.view('home', errMess)
    }
  }
}, {
  method: 'POST',
  path: '/',
  handler: async (request, h) => {
    console.log('Post handler')
    const { location } = request.payload
    return h.redirect(`/location?q=${location}`)
  },
  options: {
    validate: {
      payload: {
        location: joi.string().required()
      },
      failAction: (request, h, err) => {
        console.log('Post fail action')
        return h.view('home', { errorMessage: 'Enter a valid location' }).takeover()
      }
    }
  }
}]
