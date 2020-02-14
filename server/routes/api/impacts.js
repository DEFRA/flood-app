const floodService = require('../../services/flood')

module.exports = {
  method: 'GET',
  path: '/api/impacts',
  handler: async (request, h) => {
    // TODO: Refactor to identify all impacts in England.
    const allImpacts = await floodService.getImpactsWithin([
      -5.75447130203247,
      49.9302711486816,
      1.79968345165253,
      55.8409309387207
    ])

    // TODO: Refactor: Create getActiveImpactsWithin method or similar.
    const impacts = allImpacts.filter(active => active.telemetryactive === true)

    try {
      const geojsonObject = {
        type: 'FeatureCollection',
        features: [
        ]
      }
      for (let i = 0; i < impacts.length; i++) {
        var obsDate = impacts[i].obsfloodmonth && impacts[i].obsfloodyear ? '(' + impacts[i].obsfloodmonth + ' ' + impacts[i].obsfloodyear + ')' : ''
        geojsonObject.features.push({
          type: 'Feature',
          id: 'impacts.' + impacts[i].impactid,
          properties: {
            shortName: impacts[i].shortname,
            description: impacts[i].description,
            stationId: impacts[i].rloiid,
            impactId: impacts[i].impactid,
            stationName: impacts[i].gauge,
            value: impacts[i].value,
            obsDate: obsDate
          },
          geometry: JSON.parse(impacts[i].coordinates)
        })
      }
      return geojsonObject
    } catch (err) {
      request.yar.set('displayError', { errorMessage: 'Unable to process your request. Please try again later.' })
      return h.redirect('/find-location')
    }
  }
}
