const floodService = require('../services/flood')

module.exports = {
  method: 'GET',
  path: '/station-csv/{id}/{direction?}',
  handler: async (request, h) => {
    const { id } = request.params
    let { direction } = request.params

    // Convert human readable url to service parameter
    direction = direction === 'downstream' ? 'd' : 'u'

    const [telemetry] = await Promise.all([
      floodService.getStationTelemetry(id, direction)
    ])

    const csvData = telemetry.map(item => {
      return { Timestamp: item.ts, Level: item._ }
    })

    return csvData
  }
}