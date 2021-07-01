const floodService = require('../services/flood')
const moment = require('moment-timezone')

module.exports = {
  method: 'GET',
  path: '/station-csv/{id}/{direction?}',
  handler: async (request, h) => {
    const { id } = request.params
    let { direction } = request.params

    direction = direction === 'downstream' ? 'd' : 'u'

    const station = await floodService.getStationById(id, direction)

    const [telemetry, thresholds] = await Promise.all([
      floodService.getStationTelemetry(id, direction),
      floodService.getStationForecastThresholds(id)
    ])

    this.telemetry = telemetry

    if (thresholds.length) {
      // Forecast station
      const values = await floodService.getStationForecastData(station.wiski_id)
      const forecast = values.SetofValues[0].Value

      const forecastData = forecast.map(item => {
        const date = moment(item.$.date + ' ' + item.$.time).format('YYYY-MM-DDTHH:mm') + 'Z'
        return { ts: date, _: item._ }
      })
      // forecastData = this.forecastData
      this.telemetry.push(...forecastData)
    }

    const csvString = [
      [
        'Timestamp',
        'Level'
      ],
      ...this.telemetry.map(item => [
        item.ts,
        item._
      ])
    ]
      .map(e => e.join(','))
      .join('\n')
    const response = h.response(csvString)
    response.type('text/csv')
    response.header('Content-disposition', 'attachment; filename=station-' + id + '.csv')
    return response
  }
}
