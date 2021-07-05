const floodService = require('../services/flood')

module.exports = {
  method: 'GET',
  path: '/error',
  handler: async (request, h) => {
    await floodService.getError()
  }
}
