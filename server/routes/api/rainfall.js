const config = require('../../config')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.restClientTimeoutMillis
})

const moment = require('moment')
const momentDate = moment()
const rainfallApiUri = config.rainfallApiUrl

module.exports = {
  method: 'GET',
  path: '/api/rainfall',
  handler: async (request, h) => {
    const url = rainfallApiUri + '/id/stations?parameter=rainfall&_limit=2000&_view=full'
    try {
      const { payload } = await wreck.get(url, { json: true })
      const geojsonObject = {
        type: 'FeatureCollection',
        features: [
        ]
      }
      if (payload.items === undefined || payload.items.length === 0) {
        const error = 'No items returned'
        throw error
      }
      for (let i = 0; i < payload.items.length; i++) {
        geojsonObject.features.push({
          type: 'Feature',
          id: 'rain.' + payload.items[i].stationReference,
          properties: {
            label: payload.items[i].label,
            stationReference: payload.items[i].stationReference,
            gridRef: payload.items[i].gridReference,
            value: 0,
            latestDate: momentDate,
            stationDetails: payload.items[i]['@id']
          },
          geometry: {
            type: 'Point',
            coordinates: [
              payload.items[i].long,
              payload.items[i].lat
            ]
          }
        })
      }
      return geojsonObject
    } catch (err) {
      request.yar.set('displayError', { errorMessage: 'Unable to process your request. Please try again later.' })
      return h.redirect('/find-location')
    }
  },
  options: {
    description: 'Rainfall API'
  }
}
