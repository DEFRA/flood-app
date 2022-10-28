/*
* Add an `onPreResponse` listener to return error pages
*/

module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (response.isBoom) {
          // An error was raised during
          // processing the request
          const statusCode = response.output.statusCode

          // In the event of 404
          // return the `404` view
          if (statusCode === 404) {
            return h.view('404').code(404)
          }
          // In the event of 429 (rate limit exceeded)
          // return the `429` view
          if (statusCode === 429) {
            request.log('error', {
              statusCode: statusCode,
              path: request.path,
              situation: response.message
            })
            return h.view('429').code(429)
          }

          // gets captured in pm2 log file, details sent to error file below
          request.log('error', {
            statusCode: statusCode,
            situation: response.message
          })

          // gets captured in pm2 error file
          console.error(response)

          // 400 && params input is joi error
          if (statusCode === 400 && response.message === 'Invalid request params input') {
            return h.view('404').code(404)
          }

          if (statusCode === 500 && response.name === 'LocationSearchError') {
            return h.view('location-error').code(statusCode)
          }

          // The return the `500` view
          return h.view('500').code(statusCode)
        }

        return h.continue
      })
    }
  }
}
