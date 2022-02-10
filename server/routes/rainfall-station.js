const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/rainfall')
// const additionalWelshStations = [4162, 4170, 4173, 4174, 4176]
// const { nrwStationUrl } = require('../config')

module.exports = {
  method: 'GET',
  path: '/rainfall-station/{id}',
  handler: async (request, h) => {
    const { id } = request.params

    const rainfallStation = await request.server.methods.flood.getRainfallByStation(id)
    const rainfallStationTotal = await request.server.methods.flood.getRainfallStationTotals(id)

    // Null rainfallStation, but in this case service should return a 404 error so i don't think this ever gets hit, defensive programming though
    if (!rainfallStation) {
      return boom.notFound('No rainfall station found')
    }
    if (!rainfallStationTotal) {
      return boom.notFound('No rainfall station totals found')
    }

    // Non-forecast Station
    const model = new ViewModel(rainfallStation, rainfallStationTotal)
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
