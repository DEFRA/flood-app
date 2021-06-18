const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/rainfall.geojson',
  options: {
    description: 'Get rainfall data in geojson format from service cache',
    handler: () => floodService.getRainfallGeojson(),
    app: {
      useErrorPages: false
    }
  }
}
