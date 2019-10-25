const Joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const floodService = require('../services/flood')
const ViewModel = require('../models/views/station')
const additionalWelshStations = [4162, 4170, 4173, 4174, 4176]
const nrwStationUrl = 'http://rloi.naturalresources.wales/ViewDetails?station='

module.exports = {
  method: 'GET',
  path: '/station/{id}/{direction?}',
  handler: async (request, h) => {
    const { id } = request.params
    let { direction } = request.params

    // Convert human readable url to service parameter
    direction = direction === 'downstream' ? 'd' : 'u'

    if (additionalWelshStations.indexOf(id) > -1) {
      return h.redirect(nrwStationUrl + id)
    }

    try {
      const station = await floodService.getStationById(id, direction)

      // If station is multi but neither param is specified redirect to upstream
      if (station.station_type === 'M' && !request.params.direction) {
        return h.redirect(`/station/${id}/upstream`)
      }

      if (!station) {
        return boom.notFound('No station found')
      }

      if ((station.region || '').toLowerCase() === 'wales') {
        return h.redirect(nrwStationUrl + id)
      }

      const telemetry = await floodService.getStationTelemetry(id, direction)

      // Get thresholds first as this will tell us if should be a forecast or not
      const thresholds = await floodService.getStationForecastThresholds(id)

      // Get impacts for the station
      const impacts = await floodService.getImpactData(station.rloi_id)

      // Check if it's a forecast station
      if (Object.keys(thresholds).length) { // DL: getStationForecastThresholds can return an empty object??
        // Forecast station
        const values = await floodService.getStationForecastData(station.wiski_id)

        const forecast = {
          thresholds,
          values
        }

        const model = new ViewModel({ station, telemetry, forecast, impacts })

        model.hasBackButton = Boolean(request.headers.referer)

        return h.view('station', { model })
      } else {
        // Non-forecast Station
        const model = new ViewModel({ station, telemetry, impacts })
        model.hasBackButton = Boolean(request.headers.referer)

        return h.view('station', { model })
      }
    } catch (err) {
      return err.isBoom
        ? err
        : boom.badRequest('Failed to get station', err)
    }
  },
  options: {
    validate: {
      params: {
        id: Joi.number().required(),
        direction: Joi.string().valid('downstream', 'upstream')
      }
    }
  }
}
