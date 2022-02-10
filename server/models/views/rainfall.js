const { date } = require('@hapi/joi')
const moment = require('moment-timezone')
const tz = 'Europe/London'

class ViewModel {
  constructor (rainfallStation, rainfallStationTotal) {
    Object.assign(this, {
      pageTitle: 'Check for flooding in England',
      metaDescription:
        'View current flood warnings and alerts for England and the national flood forecast for the next 5 days. Also check river, sea, groundwater and rainfall levels.',
      metaCanonical: '/',
      stationName: rainfallStationTotal[0].station_name.replace(/(^\w|\s\w)(\S*)/g, (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()),
      telemetry: rainfallStation || []
    })

    if (this.telemetry.length) {
      const now = moment().tz(tz).format()
      const fiveDaysAgo = moment().subtract(5, 'days').format()
      const latestDateTime = this.telemetry[0].value_timestamp
      this.latestDayFormatted = moment(latestDateTime).tz(tz).format('Do MMMM')
      this.latestTimeFormatted = moment(latestDateTime).tz(tz).format('h:ma')
      const dataStartDateTime = fiveDaysAgo
      const rangeStartDateTime = fiveDaysAgo
      const dataEndDateTime = now
      const rangeEndDateTime = now
      const latest1hr = rainfallStationTotal[0].one_hr_total
      const latest6hr = rainfallStationTotal[0].six_hr_total
      const latest24hr = rainfallStationTotal[0].day_total
      this.period = this.telemetry[0].period

      const values = this.telemetry.map(data => {
        return {
          dateTime: data.value_timestamp,
          value: data.value
        }
      })

      values.sort((a, b) => b.dateTime - a.dateTime)

      this.telemetryRainfall = {
        latestDateTime,
        dataStartDateTime,
        rangeStartDateTime,
        dataEndDateTime,
        rangeEndDateTime,
        latest1hr,
        latest6hr,
        latest24hr,
        minutes: {
          latestDateTime,
          values
        }
      }
    }
  }
}

module.exports = ViewModel
