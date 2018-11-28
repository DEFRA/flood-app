const floodService = require('../services/flood')
const ViewModel = require('../models/views/national')

module.exports = {
  method: 'GET',
  path: '/national',
  handler: async (request, h) => {
    const { floods } = await floodService.getFloods()
    const outlook = await floodService.getOutlook()
    const model = new ViewModel({ floods, outlook })

    return h.view('national', { model })
  }
}
