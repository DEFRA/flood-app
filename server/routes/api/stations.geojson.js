const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/stations.geojson',
  options: {
    description: 'Get stations data in geojson format from service cache',
    handler: async (request, h) => {
      return floodService.stationsGeojson
    },
    app: {
      useErrorPages: false
    }
  }
}