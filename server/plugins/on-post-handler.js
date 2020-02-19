// Plugin is to add some fields required by the service layout to route context object
const { siteUrl } = require('../config')
const floodService = require('../services/flood')

module.exports = {
  plugin: {
    name: 'on-post-handler',
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
            request.response.source.context.isDummyData = floodService.floods.isDummyData
          } else {
            request.response.source.context = {
              fullUrl: encodeURI(fullUrl),
              isDummyData: floodService.floods.isDummyData
            }
          }
        }
        return h.continue
      })
    }
  }
}
