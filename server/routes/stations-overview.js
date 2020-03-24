const floodService = require('../services/flood')
module.exports = {
  method: 'GET',
  path: '/stations-overview',
  handler: async (request, h) => {
    return h.view('stations-overview', {
      stations: await floodService.getStationsOverview()
    })
  }
}
