const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/station')
const additionalWelshStations = [4162, 4170, 4173, 4174, 4176]
const { nrwStationUrl, rateLimitEnabled } = require('../config')

module.exports = {
  method: 'GET',
  path: '/station/{id}/{direction?}',
  handler: async (request, h) => {
    const { id } = request.params
    let { direction } = request.params

    // Convert human readable url to service parameter
    direction = direction === 'downstream' ? 'd' : 'u'

    // Welsh stations
    const nrwParameter = '?parameterType=1'
    if (additionalWelshStations.indexOf(id) > -1) {
      return h.redirect(`${nrwStationUrl}${id}${nrwParameter}`)
    }

    const station = await request.server.methods.flood.getStationById(id, direction)

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
      return h.redirect(`${nrwStationUrl}${id}${nrwParameter}`)
    }

    // batching all the service calls together, greatly improves page performance
    const [telemetry, thresholds, impacts, warningsAlerts, river] = await Promise.all([
      request.server.methods.flood.getStationTelemetry(id, direction),
      request.server.methods.flood.getStationForecastThresholds(id),
      request.server.methods.flood.getImpactData(station.rloi_id),
      request.server.methods.flood.getWarningsAlertsWithinStationBuffer(station.rloi_id),
      request.server.methods.flood.getRiverStationByStationId(id)
    ])

    if (station.status === 'Closed') {
      const river = []
      const model = new ViewModel({ station, telemetry, impacts, river, warningsAlerts })
      return h.view('station', { model })
    }

    // Check if it's a forecast station
    if (thresholds.length && station.status !== 'Suspended') {
      // Forecast station
      const values = await request.server.methods.flood.getStationForecastData(station.wiski_id)
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
    plugins: {
      'hapi-rate-limit': {
        enabled: rateLimitEnabled
      }
    },
    validate: {
      params: joi.object({
        id: joi.number().required(),
        direction: joi.string().valid('downstream', 'upstream')
      })
    }
  }
}
