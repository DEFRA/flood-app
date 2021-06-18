const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/stations.geojson',
  options: {
    description: 'Get stations data in geojson format from service cache',
    handler: () => floodService.getStationsGeoJson(),
    app: {
      useErrorPages: false
    }
  }
}
