const getStationsV2GeoJson = require('../../models/stations-v2-geojson')

module.exports = {
  method: 'GET',
  path: '/api/stations-v2.geojson',
  options: {
    description: 'Get stations data in geojson format from service cache (v2)',
    handler: async (request, h) => {
      const stations = await request.server.methods.flood.getStationsGeoJsonV2()
      const stationsGeoJson = getStationsV2GeoJson(stations)

      const response = h.response(stationsGeoJson)
      response.type('application/geo+json; charset=utf-8')
      return response
    },
    app: {
      useErrorPages: false
    }
  }
}
