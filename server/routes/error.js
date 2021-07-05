const floodService = require('../services/flood')

module.exports = {
  method: 'GET',
  path: '/error',
  handler: () => floodService.getError()
}
