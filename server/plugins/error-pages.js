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
        let view = '500'
        let logLevel = 'error'
        let statusCode = response.output.statusCode

        if (statusCode === 500 && response.name === 'LocationSearchError') {
          view = 'location-error'
          viewModel.pageTitle = 'Sorry, there is a problem with the search - Check for flooding'
        }
        if (statusCode === 429) {
          view = '429'
          logLevel = 'warn'
        }
        if (statusCode === 404 || (statusCode === 400 && response.message === 'Invalid request params input')) {
          statusCode = 404
          view = '404'
          logLevel = 'debug'
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
