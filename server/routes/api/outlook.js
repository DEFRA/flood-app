const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/outlook.geojson',
  options: {
    description: 'Get outlook geojson data from cache',
    handler: async (request, h) => {
      return floodService.outlook.geoJson
    },
    app: {
      useErrorPages: false
    }
  }
}
