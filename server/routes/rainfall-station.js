const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/rainfall')

module.exports = {
  method: 'GET',
  path: '/rainfall-station/{id}',
  handler: async (request, h) => {
    const { id } = request.params

    const [
      rainfallStation,
      rainfallStationTelemetry
    ] = await Promise.all([
      request.server.methods.flood.getRainfallStation(id),
      request.server.methods.flood.getRainfallStationTelemetry(id)
    ])

    if (!rainfallStation) {
      return boom.notFound('Rainfall station not found')
    }
    if (!rainfallStationTelemetry) {
      return boom.notFound('No rainfall station telemetry data found')
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
