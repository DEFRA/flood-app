const floodService = require('../services/flood')
const ViewModel = require('../models/views/national')

module.exports = {
  method: 'GET',
  path: '/national',
  handler: async (request, h) => {
    // get the cached floods
    const floods = floodService.floods

    // get the cached outlook
    const outlook = floodService.outlook

    const model = new ViewModel(floods, outlook)

    return h.view('national', { model })
  }
}
