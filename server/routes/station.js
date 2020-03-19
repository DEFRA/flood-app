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

    const river = await floodService.getRiverStationByStationId(id)

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

    // Get telemetry
    const telemetry = await floodService.getStationTelemetry(id, direction)

    // Get thresholds first as this will tell us if should be a forecast or not
    const thresholds = await floodService.getStationForecastThresholds(id)

    // Get impacts for the station
    const impacts = await floodService.getImpactData(station.rloi_id)

    // Check if it's a forecast station
    if (Object.keys(thresholds).length) { // DL: getStationForecastThresholds can return an empty object??
      // Forecast station
      const values = await floodService.getStationForecastData(station.wiski_id)
      const forecast = { thresholds, values }
      const model = new ViewModel({ station, telemetry, forecast, impacts, river })
      return h.view('station', { model })
    } else {
      // Non-forecast Station
      const model = new ViewModel({ station, telemetry, impacts, river })
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
