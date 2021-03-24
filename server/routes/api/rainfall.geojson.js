const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/rainfall.geojson',
  options: {
    description: 'Get rainfall data in geojson format from service cache',
    handler: async () => floodService.rainfallGeojson,
    app: {
      useErrorPages: false
    }
  }
}
