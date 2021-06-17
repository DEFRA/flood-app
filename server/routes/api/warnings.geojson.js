const floodService = require('../../services/flood')
const FloodsModel = require('../../models/floods')

module.exports = {
  method: 'GET',
  path: '/api/warnings.geojson',
  options: {
    description: 'Get warnings data in geojson format',
    handler: async () => {
      const floods = new FloodsModel(await floodService.getFloods())
      return floods.geojson
    },
    app: {
      useErrorPages: false
    }
  }
}
