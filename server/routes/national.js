const floodService = require('../services/flood')
const OutlookModel = require('../models/outlook')
const ViewModel = require('../models/views/national')

module.exports = {
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
    // Get floods from in memory
    const floods = await floodService.floods

    const outlook = new OutlookModel(await floodService.getOutlook())

    const model = new ViewModel(floods, outlook)

    return h.view('national', { model })
  }
}
