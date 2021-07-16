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

    const stationName = station.external_name.replace(/\s/g, '-')

    const [telemetry, thresholds] = await Promise.all([
      floodService.getStationTelemetry(id, direction),
      floodService.getStationForecastThresholds(id)
    ])

    this.telemetry = telemetry

    this.telemetry.forEach(function (item) {
      item.type = 'observed'
      item.ts = moment.utc(item.ts).format()
    })

    // Forecast station
    if (thresholds.length) {
      const values = await floodService.getStationForecastData(station.wiski_id)

      const forecast = values.SetofValues[0].Value

      const forecastData = forecast.map(item => {
        const itemDate = item.$.date
        const itemTime = item.$.time
        const date = moment(`${itemDate} ${itemTime}`).format('YYYY-MM-DDTHH:mm') + 'Z'
        return { ts: date, _: item._, type: 'forecast' }
      })

      // Truncate forecast data to be 36 hours from forecast creation
      const forecastStart = moment(this.telemetry[0].ts)

      this.truncateDate = moment(forecastStart).add(36, 'hours')

      forecastData.forEach(function (value) {
        value.ts = moment(value.ts)

        if (value.ts.isBefore(forecastStart) || value.ts.isAfter(this.truncateDate)) {
          return
        }
        value.ts = moment.utc(value.ts).format()

        this.telemetry.push(value)
      }, this)
    }

    this.telemetry.sort(function (a, b) {
      return new Date(a.ts) - new Date(b.ts)
    })

    if (thresholds.length) {
      this.csvString = [
        [
          'Timestamp (UTC)',
          'Height (m)',
          'Type(observed/forecast)'
        ],
        ...this.telemetry.map(item => [
          item.ts,
          item._,
          item.type
        ])
      ]
        .map(e => e.join(','))
        .join('\n')
    } else {
      this.csvString = [
        [
          'Timestamp (UTC)',
          'Height (m)'
        ],
        ...this.telemetry.map(item => [
          item.ts,
          item._
        ])
      ]
        .map(e => e.join(','))
        .join('\n')
    }

    const response = h.response(this.csvString)
    response.type('text/csv')
    response.header('Content-disposition', `attachment; filename=${stationName}-height-data.csv`)
    return response
  }
}
