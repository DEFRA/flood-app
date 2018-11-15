const floodService = require('../services/flood')
const ViewModel = require('../models/views/outlook')

module.exports = {
  method: 'GET',
  path: '/outlook',
  handler: async (request, h) => {
    const { statement: outlook } = await floodService.getOutlook()
    const model = new ViewModel({ outlook })

    return h.view('outlook', { model })
  }
}
