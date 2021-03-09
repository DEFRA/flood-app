const data = require('../../models/places.json')

module.exports = {
  method: 'GET',
  path: '/api/places.geojson',
  options: {
    description: 'Get places data',
    handler: async () => data,
    app: {
      useErrorPages: false
    }
  }
}
