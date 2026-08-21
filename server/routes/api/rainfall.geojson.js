const { handleProxyError } = require('./lib/handle-proxy-error')

module.exports = {
  method: 'GET',
  path: '/api/rainfall.geojson',
  options: {
    description: 'Get rainfall data in geojson format from service cache',
    handler: async (request, h) => {
      try {
        return await request.server.methods.flood.getRainfallGeojson()
      } catch (err) {
        request.logger.error({ err }, 'Error fetching rainfall geojson')
        return handleProxyError(h, err, 'Failed to fetch rainfall geojson')
      }
    },
    app: {
      useErrorPages: false
    }
  }
}
