const floodService = require('../services/flood')
const moment = require('moment-timezone')
const boom = require('@hapi/boom')
const joi = require('joi')

const maxId = 999

module.exports = {
  method: 'GET',
  path: '/station-csv/{id}/{direction?}',
  options: {
    validate: {
      params: joi.object({
        id: joi.number().greater(maxId).less(100000).required(),
        direction: joi.string().valid('downstream', 'upstream')
      })
    }
  },
  handler: async (request, h) => {
    const { id } = request.params
    let { direction } = request.params

    direction = direction === 'downstream' ? 'd' : 'u'

    const station = await floodService.getStationById(id, direction)

    if (!station) {
      return boom.notFound('Station not found')
    }

    const stationName = station.external_name.replace(/[^a-zA-Z0-9]+/g, '-')

    const [rawTelemetry, forecastFlag] = await Promise.all([
      floodService.getStationTelemetry(id, direction),
      floodService.getForecastFlag(id, direction)
    ])

    const telemetry = rawTelemetry.map(item => ({
      ...item,
      type: 'observed',
      ts: moment.utc(item.ts).format()
    }))

    // Forecast station
    const includeForecast = forecastFlag.display_time_series
    const truncateDateHoursToAdd = 36

    if (includeForecast && telemetry.length) {
      const forecastStart = moment(telemetry[0].ts)
      const truncateDate = moment(forecastStart).add(truncateDateHoursToAdd, 'hours')
      const { SetofValues: [{ Value: forecast } = { Value: [] }] = [] } = await floodService.getStationForecastData(station.wiski_id)

      for (const item of forecast) {
        const itemDate = item.$.date
        const itemTime = item.$.time
        const date = moment(`${itemDate}T${itemTime}Z`)

        if (!date.isBefore(forecastStart) && !date.isAfter(truncateDate)) {
          telemetry.push({
            ts: moment.utc(date).format(),
            _: item._,
            type: 'forecast'
          })
        }
      }
    }

    const csvString = [
      [
        'Timestamp (UTC)',
        'Height (m)',
        'Type(observed/forecast)'
      ],
      ...telemetry
        .sort((a, b) => new Date(a.ts) - new Date(b.ts))
        .map(item => [
          item.ts,
          isNaN(parseFloat(item._)) ? NaN : parseFloat(item._).toFixed(2), // Fix: Parse as float and round to 2 decimal places, handle NaN case
          item.type
        ])
    ]
      .reduce((acc, [ts, height, type]) => {
        acc += `${ts},${height}`
        if (includeForecast) {
          acc += `,${type}`
        }
        return `${acc}\n`
      }, '')
      .trim()

    const response = h.response(csvString)
    response.type('text/csv')
    response.header('Content-disposition', `attachment; filename=${stationName}-height-data.csv`)
    return response
  }
}
