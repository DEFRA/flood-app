const floodService = require('../services/flood')

module.exports = {
  method: 'GET',
  path: '/error',
  handler: async () => await floodService.getError()
}
