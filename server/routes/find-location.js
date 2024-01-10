'use strict'

module.exports = [{
  method: 'GET',
  path: '/find-location',
  // note: this handler can be removed once the redirect is added at the infrastructure level
  handler: async (_request, h) => h.redirect('/').code(301)

}]
