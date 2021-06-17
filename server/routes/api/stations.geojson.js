module.exports = {
  method: 'GET',
  path: '/api/stations.geojson',
  options: {
    description: 'Get stations data in geojson format from service cache',
    handler: request => request.server.methods.flood.getStationsGeoJson(),
    app: {
      useErrorPages: false
    }
  }
}
