const OutlookModel = require('../models/outlook')
const FloodsModel = require('../models/floods')
const ViewModel = require('../models/views/national')

module.exports = {
  method: 'GET',
  path: '/',
  handler: async (request, h) => {
    const floods = new FloodsModel(await request.server.methods.flood.getFloods())

    let outlook = {}
    try {
      outlook = new OutlookModel(await request.server.methods.flood.getOutlook(), request.logger)
    } catch (err) {
      request.logger.warn({
        situation: 'outlook error',
        err
      })
      outlook.dataError = true
    }

    const model = new ViewModel(floods, outlook)

    return h.view('national', { model })
  }
}
