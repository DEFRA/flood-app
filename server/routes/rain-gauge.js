const ViewModel = require('../models/views/rain-gauge')

module.exports = {
  method: 'GET',
  path: '/rain-gauge/{name}',
  handler: async (request, h) => {
    const name = request.params.name
    const model = new ViewModel(name)
    return h.view('rain-gauge', { model })
  }
}
