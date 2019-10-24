const { siteUrl } = require('../config')
/*
* Add full url to context of view for opengraph meta property
*/

module.exports = {
  plugin: {
    name: 'full-url',
    register: (server, options) => {
      server.ext('onPostHandler', function (request, h) {
        if (request.response.variety === 'view') {
          let fullUrl = siteUrl + request.path
          if (request.query) {
            Object.keys(request.query).forEach(function (key, index) {
              fullUrl += (index === 0 ? '?' : '&') + key + '=' + request.query[key]
            })
          }

          if (request.response.source.context) {
            request.response.source.context.fullUrl = encodeURI(fullUrl)
          } else {
            request.response.source.context = {
              fullUrl: encodeURI(fullUrl)
            }
          }
        }
        return h.continue
      })
    }
  }
}
