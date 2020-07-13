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
    // The two API calls
    const url = rainfallApiUri + '/id/stations?parameter=rainfall&_limit=2000&_view=full'
    const urlValues = rainfallApiUri + '/id/measures?parameter=rainfall'

    try {
      const { payload } = await wreck.get(url, { json: true })
      const payload2 = await wreck.get(urlValues, { json: true })

      // Two arrays of data from both API calls
      const stations = payload.items
      const values = payload2.payload.items

      // Move the values object in to stations array if they have the same Station Reference
      let result = stations.map(o => ({ ...o, ...values.find(_o => _o.stationReference === o.stationReference) }))

      // Remove an objects that dont have a latest reading object
      result = result.filter(obj => obj.latestReading)

      const geojsonObject = {
        type: 'FeatureCollection',
        features: [
        ]
      }
      if (result === undefined || result.length === 0) {
        const error = 'No items returned'
        throw error
      }

      // result[i].latestReading ? result[i].latestReading.value : null

      for (let i = 0; i < result.length; i++) {
        geojsonObject.features.push({
          type: 'Feature',
          id: 'rain.' + result[i].stationReference,
          properties: {
            label: result[i].label,
            stationReference: result[i].stationReference,
            gridRef: result[i].gridReference,
            value: result[i].latestReading.value,
            latestDate: momentDate,
            stationDetails: result[i]['@id']
          },
          geometry: {
            type: 'Point',
            coordinates: [
              result[i].long,
              result[i].lat
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
