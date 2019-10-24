/*
* Add an `onPreResponse` listener to return error pages
*/

module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response
        // These paths need specific validation for posts requests
        const excludePaths = [
          '/',
          '/alerts-and-warnings',
          '/river-and-sea-levels',
          '/historic-impacts'
        ]

        if (response.isBoom) {
          console.log('Error: ' + request.route.method)
        }

        if (response.isBoom && !(excludePaths.includes(request.route.path) && request.route.method === 'post')) {
          // An error was raised during
          // processing the request
          const statusCode = response.output.statusCode

          // In the event of 404
          // return the `404` view
          if (statusCode === 404) {
            return h.view('404').code(statusCode)
          }

          request.log('error', {
            statusCode: statusCode,
            data: response.data,
            message: response.message
          })

          // In the event of 400
          // return the invalid location error
          if (statusCode === 400) {
            // request.yar.set('displayError', { errorMessage: 'Bad request' })
            return h.view('404').code(statusCode)
          }

          // The return the `500` view
          return h.view('500').code(statusCode)
        }
        return h.continue
      })
    }
  }
}
