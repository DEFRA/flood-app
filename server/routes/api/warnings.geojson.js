const FloodsModel = require('../../models/floods')

module.exports = {
  method: 'GET',
  path: '/api/warnings.geojson',
  options: {
    description: 'Get warnings data in geojson format',
    handler: async request => {
      const floods = new FloodsModel(await request.server.methods.flood.getFloods())
      return floods.geojson
    },
    app: {
      useErrorPages: false
    }
  }
}
