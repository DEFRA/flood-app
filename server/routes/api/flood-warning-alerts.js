const config = require('../../config')
const util = require('../../util')
const { handleProxyError } = require('./lib/handle-proxy-error')
const { HTTP_BAD_REQUEST } = require('../../constants')

module.exports = {
  method: 'GET',
  path: '/api/flood-warning-alerts-geojson',
  handler: async (request, h) => {
    try {
      const bbox = request.query.bbox
      if (!bbox) {
        return h.response({ error: 'bbox parameter required' }).code(HTTP_BAD_REQUEST)
      }
      // Encode bbox as a single query parameter value so it cannot be split into
      // additional backend query parameters (e.g. via an encoded '&' in the input)
      const query = new URLSearchParams({ bbox })
      const url = `${config.serviceUrl}/flood-warning-alerts-geojson?${query}`
      const data = await util.getJson(url)
      return data
    } catch (err) {
      request.logger.error({ err }, 'Error fetching flood warning alerts geojson')
      return handleProxyError(h, err, 'Failed to fetch flood warning alerts')
    }
  },
  options: {
    description: 'Proxy flood warning alerts geojson from backend service'
  }
}
