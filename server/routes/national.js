const floodService = require('../services/flood')
const OutlookModel = require('../models/outlook')
const FloodsModel = require('../models/floods')
const ViewModel = require('../models/views/national')

module.exports = {
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
    const floods = new FloodsModel(await floodService.getFloods())

    let outlook = {}
    try {
      outlook = new OutlookModel(await floodService.getOutlook())
    } catch (err) {
      console.error(err)
      outlook.dataError = true
    }

    const model = new ViewModel(floods, outlook)

    return h.view('national', { model })
  }
}
