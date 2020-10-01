const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const floodService = require('../services/flood')
const ViewModel = require('../models/views/station')
const additionalWelshStations = [4162, 4170, 4173, 4174, 4176]
const nrwStationUrl = 'https://rloi.naturalresources.wales/ViewDetails?station='

module.exports = {
  method: 'GET',
  path: '/station/{id}/{direction?}',
  handler: async (request, h) => {
    const { id } = request.params
    let { direction } = request.params

    // Convert human readable url to service parameter
    direction = direction === 'downstream' ? 'd' : 'u'

    // Welsh stations
    if (additionalWelshStations.indexOf(id) > -1) {
      return h.redirect(nrwStationUrl + id)
    }

    const station = await floodService.getStationById(id, direction)

    // If upstream param is specified redirect route of station
    if (request.params.direction === 'upstream') {
      return h.redirect(`/station/${id}`)
    }

    // Null station, but in this case service should return a 404 error so i don't think this ever gets hit, defensive programming though
    if (!station) {
      return boom.notFound('No station found')
    }

    // Welsh stations
    if ((station.region || '').toLowerCase() === 'wales') {
      return h.redirect(nrwStationUrl + id)
    }

    // batching all the service calls together, greatly improves page performance
    const [telemetry, thresholds, impacts, warningsAlerts, river] = await Promise.all([
      floodService.getStationTelemetry(id, direction),
      floodService.getStationForecastThresholds(id),
      floodService.getImpactData(station.rloi_id),
      floodService.getWarningsAlertsWithinStationBuffer(station.rloi_id),
      floodService.getRiverStationByStationId(id)
    ])

    if (station.status === 'Closed') {
      const river = []
      const model = new ViewModel({ station, telemetry, impacts, river, warningsAlerts })
      return h.view('station', { model })
    }

    // Check if it's a forecast station
    if (thresholds.length) {
      // Forecast station
      const values = await floodService.getStationForecastData(station.wiski_id)
      const forecast = { thresholds, values }
      const model = new ViewModel({ station, telemetry, forecast, impacts, river, warningsAlerts })
      return h.view('station', { model })
    } else {
      // Non-forecast Station
      const model = new ViewModel({ station, telemetry, impacts, river, warningsAlerts })
      return h.view('station', { model })
    }
  },
  options: {
    validate: {
      params: joi.object({
        id: joi.number().required(),
        direction: joi.string().valid('downstream', 'upstream')
      })
    }
  }
}
