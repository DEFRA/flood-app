const config = require('../../config')
const util = require('../../util')

module.exports = {
  method: 'GET',
  path: '/api/flood-warning-alerts-geojson',
  handler: async (request, h) => {
    try {
      const bbox = request.query.bbox
      if (!bbox) {
        return h.response({ error: 'bbox parameter required' }).code(400)
      }
      const url = `${config.serviceUrl}/flood-warning-alerts-geojson?bbox=${bbox}`
      const data = await util.getJson(url)
      return data
    } catch (err) {
      request.logger.error({ err }, 'Error fetching flood warning alerts geojson')
      return h.response({ error: 'Failed to fetch flood warning alerts' }).code(500)
    }
  },
  options: {
    description: 'Proxy flood warning alerts geojson from backend service'
  }
}
