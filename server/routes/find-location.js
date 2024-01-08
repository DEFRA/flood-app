'use strict'

module.exports = [{
  method: 'GET',
  path: '/find-location',
  handler: async (request, h) => {
    // note: this handler can be removed once the redirect is added at the infrastructure level
    return h.redirect('/').code(301)
  }
}]
