const { handleProxyError } = require('./lib/handle-proxy-error')

module.exports = {
  method: 'GET',
  path: '/api/stations.geojson',
  options: {
    description: 'Get stations data in geojson format from service cache',
    handler: async (request, h) => {
      try {
        return await request.server.methods.flood.getStationsGeoJson()
      } catch (err) {
        request.logger.error({ err }, 'Error fetching stations geojson')
        return handleProxyError(h, err, 'Failed to fetch stations geojson')
      }
    },
    app: {
      useErrorPages: false
    }
  }
}
