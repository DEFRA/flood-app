// Plugin is to add some fields required by the service layout to route context object
const { siteUrl, mockExternalHttp } = require('../config')
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

          const requestHeadersReferer = request.headers.referer && request.headers.referer.startsWith(siteUrl) ? request.headers.referer : ''

          if (request.response.source.context) {
            request.response.source.context.fullUrl = encodeURI(fullUrl)
            request.response.source.context.isDummyData = floodService.floods.isDummyData
            request.response.source.context.setCookieUsage = request.state.set_cookie_usage
            request.response.source.context.seenCookieMessage = request.state.seen_cookie_message
            request.response.source.context.isMockExternalHttp = mockExternalHttp
            if (request.response.source.context.model) {
              request.response.source.context.model.referer = requestHeadersReferer
            } else {
              request.response.source.context.model = {
                referer: requestHeadersReferer
              }
            }
          } else {
            request.response.source.context = {
              fullUrl: encodeURI(fullUrl),
              isDummyData: floodService.floods.isDummyData,
              isMockExternalHttp: floodService.mockExternalHttp,
              model: {
                referer: requestHeadersReferer
              }
            }
          }
        }
        return h.continue
      })
    }
  }
}
