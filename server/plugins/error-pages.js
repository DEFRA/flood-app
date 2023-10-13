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
            statusCode: response.statusCode
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
        } else if (statusCode === 429) {
          view = '429'
          logLevel = 'warn'
        } else if (statusCode === 404 || (statusCode === 400 && response.message === 'Invalid request params input')) {
          statusCode = 404
          view = '404'
          logLevel = 'debug'
        }

        request.logger[logLevel]({
          statusCode,
          situation: response.message,
          stack: response.stack
        })
        return h.view(view, viewModel).code(statusCode)
      })
    }
  }
}
