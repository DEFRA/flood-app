const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/warnings.geojson',
  options: {
    description: 'Get warnings data in geojson format',
    handler: async (request, h) => {
      return floodService.floods.geojson
    },
    app: {
      useErrorPages: false
    }
  }
}