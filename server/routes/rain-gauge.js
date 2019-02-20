const boom = require('boom')
const rainService = require('../services/rain')
const ViewModel = require('../models/views/rain-gauge')

module.exports = {
  method: 'GET',
  path: '/rain-gauge/{id}',
  handler: async (request, h) => {
    const id = request.params.id
    try {
      const rainGauge = await rainService.getRainGaugeById(id)
      const rainMeasures = await rainService.getRainMeasuresById(id)
      if (!(rainGauge && rainMeasures)) {
        return boom.notFound('No rain gauge found')
      }
      const model = new ViewModel(rainGauge, rainMeasures)
      return h.view('rain-gauge', { model })
    } catch (err) {
      return err.isBoom
        ? err
        : boom.badRequest('Failed to get rain gauge', err)
    }
  }
}
