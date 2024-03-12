/*
* Add an `onPreResponse` listener to return error pages
*/

module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (!response.isBoom) {
          request.logger.debug({
            res: response
          })
          return h.continue
        }

        const viewModel = {}
        let view
        let logLevel
        let statusCode

        const HTTP_BAD_REQUEST = 400
        const HTTP_NOT_FOUND = 404
        const HTTP_TOO_MANY_REQUESTS = 429
        const INTERNAL_SERVER_ERROR = 500

        if (response.output.statusCode === INTERNAL_SERVER_ERROR && response.name === 'LocationSearchError') {
          view = 'location-error'
          statusCode = response.output.statusCode
          logLevel = 'error'
          viewModel.pageTitle = 'Sorry, there is a problem with the search - Check for flooding'
        } else if (response.output.statusCode === HTTP_TOO_MANY_REQUESTS) {
          view = '429'
          logLevel = 'warn'
          statusCode = response.output.statusCode
        } else if (response.output.statusCode === HTTP_NOT_FOUND || (response.output.statusCode === HTTP_BAD_REQUEST && response.message === 'Invalid request params input')) {
          statusCode = 404
          view = '404'
          logLevel = 'debug'
        } else {
          view = '500'
          logLevel = 'error'
          statusCode = response.output.statusCode
        }

        request.logger[logLevel]({
          res: response,
          err: response
        })
        return h.view(view, viewModel).code(statusCode)
      })
    }
  }
}
