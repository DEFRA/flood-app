const floodService = require('../services/flood')
const ViewModel = require('../models/views/national')

module.exports = {
  method: 'GET',
  path: '/national',
  handler: async (request, h) => {
    const { floods } = await floodService.getFloods()
    const model = new ViewModel({ floods })

    return h.view('national', { model })
  }
}
