// const moment = require('moment-timezone')
// const formatDate = require('../../util').formatDate
// const { bingKeyMaps, floodRiskUrl } = require('../../config')
// const tz = 'Europe/London'

class ViewModel {
  constructor (rainfallStation) {
    Object.assign(this, {
      pageTitle: 'Check for flooding in England',
      metaDescription:
        'View current flood warnings and alerts for England and the national flood forecast for the next 5 days. Also check river, sea, groundwater and rainfall levels.',
      metaCanonical: '/',
      stationName: rainfallStation[0].station_name
    })
  }
}

module.exports = ViewModel
