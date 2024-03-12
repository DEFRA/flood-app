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

        if (response.output.statusCode === 500 && response.name === 'LocationSearchError') {
          view = 'location-error'
          statusCode = response.output.statusCode
          logLevel = 'error'
          viewModel.pageTitle = 'Sorry, there is a problem with the search - Check for flooding'
        } else if (response.output.statusCode === 429) {
          view = '429'
          logLevel = 'warn'
          statusCode = response.output.statusCode
        } else if (response.output.statusCode === 404 || (response.output.statusCode === 400 && response.message === 'Invalid request params input')) {
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
