const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/station-navigation/{stationId}',
  options: {
    description: 'Get stations data in geojson format from service cache',
    handler: async (request, h) => {
      const { stationId } = request.params
      return floodService.stations.getStationByIdWithRelations(stationId)
    },
    app: {
      useErrorPages: false
    }
  }
}
