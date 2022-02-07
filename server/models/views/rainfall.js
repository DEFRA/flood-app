// const moment = require('moment-timezone')
// const formatDate = require('../../util').formatDate
// const { bingKeyMaps, floodRiskUrl } = require('../../config')
// const tz = 'Europe/London'

class ViewModel {
  constructor (rainfallStation, rainfallStationTotal) {
    Object.assign(this, {
      pageTitle: 'Check for flooding in England',
      metaDescription:
        'View current flood warnings and alerts for England and the national flood forecast for the next 5 days. Also check river, sea, groundwater and rainfall levels.',
      metaCanonical: '/',
      stationName: rainfallStationTotal[0].station_name,
      latest1hr: rainfallStationTotal[0].one_hr_total,
      latest6hr: rainfallStationTotal[0].six_hr_total,
      latest24hr: rainfallStationTotal[0].day_total
    })
  }
}

module.exports = ViewModel
