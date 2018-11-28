const joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/',
  handler: {
    view: 'home'
  }
}, {
  method: 'POST',
  path: '/',
  handler: async (request, h) => {
    const { location } = request.payload
    return h.redirect(!location ? '/national' : `/location?q=${location}`)
  },
  options: {
    validate: {
      payload: {
        location: joi.string().required().allow('')
      }
    }
  }
}]
