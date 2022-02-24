const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/rainfall')

module.exports = {
  method: 'GET',
  path: '/rainfall-station/{id}',
  handler: async (request, h) => {
    const { id } = request.params

    const rainfallStationTelemetry = await request.server.methods.flood.getRainfallStationTelemetry(id)
    const rainfallStation = await request.server.methods.flood.getRainfallStation(id)

    // Null rainfallStationTelemetry, but in this case service should return a 404 error so i don't think this ever gets hit, defensive programming though
    if (!rainfallStationTelemetry) {
      return boom.notFound('No rainfall station found')
    }
    if (!rainfallStation) {
      return boom.notFound('No rainfall station totals found')
    }

    const model = new ViewModel(rainfallStationTelemetry, rainfallStation)
    return h.view('rainfall-station', { model })
  },
  options: {
    validate: {
      params: joi.object({
        id: joi.string().required()
      })
    }
  }
}
