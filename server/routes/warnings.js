const floodService = require('../services/flood')
const ViewModel = require('../models/views/warnings')

module.exports = {
  method: 'GET',
  path: '/alerts-and-warnings',
  handler: async (request, h) => {
    // get the cached floods
    const floods = floodService.floods
    var model = new ViewModel({ floods })
    model.referer = request.headers.referer
    return h.view('warnings', { model })
  }
}
