const floodService = require('../../services/flood')
const OutlookModel = require('../../models/outlook')

module.exports = {
  method: 'GET',
  path: '/api/outlook.geojson',
  options: {
    description: 'Get outlook geojson data from cache',
    handler: async () => {
      const { geoJson } = new OutlookModel(await floodService.getOutlook())
      return geoJson
    },
    app: {
      useErrorPages: false
    }
  }
}
