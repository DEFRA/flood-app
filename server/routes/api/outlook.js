const OutlookModel = require('../../models/outlook')

module.exports = {
  method: 'GET',
  path: '/api/outlook.geojson',
  options: {
    description: 'Get outlook geojson data from cache',
    handler: async request => {
      const { geoJson } = new OutlookModel(await request.server.methods.flood.getOutlook(), request.logger)
      return geoJson
    },
    app: {
      useErrorPages: false
    }
  }
}
