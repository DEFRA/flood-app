module.exports = {
  method: 'GET',
  path: '/api/rainfall.geojson',
  options: {
    description: 'Get rainfall data in geojson format from service cache',
    handler: request => request.server.methods.flood.getRainfallGeojson(),
    app: {
      useErrorPages: false
    }
  }
}
