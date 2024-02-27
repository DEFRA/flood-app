module.exports = {
  method: 'GET',
  path: '/api/webchat/availability',
  options: {
    description: 'Get webchat availability',
    handler: request => request.server.methods.webchat.getAvailability(),
    app: {
      useErrorPages: false
    }
  }
}
