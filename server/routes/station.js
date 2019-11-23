const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const floodService = require('../services/flood')
const ViewModel = require('../models/views/station')
const additionalWelshStations = [4162, 4170, 4173, 4174, 4176]
const nrwStationUrl = 'http://rloi.naturalresources.wales/ViewDetails?station='

module.exports = [{
  method: 'GET',
  path: '/station/{id}',
  handler: async (request, h) => {
    const { id } = request.params
    const { direction } = request.query

    if (additionalWelshStations.indexOf(id) > -1) {
      return h.redirect(nrwStationUrl + id)
    }

    try {
      const station = await floodService.getStationById(id, direction)

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
      if (thresholds) {
        const values = await floodService.getStationForecastData(station.wiski_id)

        const forecast = {
          thresholds,
          values
        }

        const model = new ViewModel({ station, telemetry, forecast, impacts })
        model.referer = request.headers.referer

        return h.view('station', { model })
      } else {
        // Non-forecast Station
        const model = new ViewModel({ station, telemetry, impacts })
        model.referer = request.headers.referer

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
      params: joi.object({
        id: joi.number().required()
      }),
      query: joi.object({
        direction: joi.string().valid('d', 'u').default('u'),
        i: joi.string()
      })
    }
  }
}, {
  method: 'GET',
  path: '/stations-upstream-downstream/{id}/{direction}',
  handler: async (request, h) => {
    const { id, direction } = request.params

    try {
      const stations = await floodService.getStationsUpstreamDownstream(id, direction)

      if (!stations) {
        return boom.notFound('No stations found')
      }

      return stations
    } catch (err) {
      return err.isBoom
        ? err
        : boom.badRequest('Failed to get upstream - downstream stations', err)
    }
  },
  options: {
    validate: {
      params: joi.object({
        id: joi.string().required(),
        direction: joi.string().valid('d', 'u').default('u')
      })
    }
  }
}]
