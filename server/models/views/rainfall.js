const moment = require('moment-timezone')
const tz = 'Europe/London'
const config = require('../../config')

class ViewModel {
  constructor (rainfallStationTelemetry, rainfallStation) {
    Object.assign(this, {
      pageTitle: 'Check for flooding in England',
      metaDescription: 'View current flood warnings and alerts for England and the national flood forecast for the next 5 days.' +
      ' Also check river, sea, groundwater and rainfall levels.',
      metaCanonical: '/',
      stationName: rainfallStation[0].station_name.replace(/(^\w|\s\w)(\S*)/g, (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()),
      telemetry: rainfallStationTelemetry || [],
      bingMaps: config.bingKeyMaps,
      stationId: rainfallStation[0].station_reference,
      centroid: [rainfallStation[0].lon, rainfallStation[0].lat],
      region: rainfallStation[0].region
    })

    if (this.telemetry.length) {
      const now = moment().tz(tz).format()
      const fiveDaysAgo = moment().subtract(5, 'days').format()
      const latestDateTime = this.telemetry[0].value_timestamp
      this.latestDayFormatted = moment(latestDateTime).tz(tz).format('Do MMMM')
      this.latestTimeFormatted = moment(latestDateTime).tz(tz).format('h:mma')
      const dataStartDateTime = fiveDaysAgo
      const rangeStartDateTime = fiveDaysAgo
      const dataEndDateTime = now
      const rangeEndDateTime = now
      const latest1hr = formatValue(rainfallStation[0].one_hr_total)
      const latest6hr = formatValue(rainfallStation[0].six_hr_total)
      const latest24hr = formatValue(rainfallStation[0].day_total)
      const valueDuration = this.telemetry[0].period === '15 min' ? 15 : 45
      this.id = `${this.stationId}.${this.region}`
      const latestHourDateTime = moment(latestDateTime).add(45, 'minutes').minutes(0).seconds(0).milliseconds(0).toDate()

      const intervals = valueDuration === 15 ? 480 : 120

      // Remove unecessary properties
      const values = this.telemetry.map(data => {
        return {
          dateTime: data.value_timestamp,
          value: Number(formatValue(data.value))
        }
      })

      // Extend telemetry upto latest interval, could be 15 or 60 minute intervals
      while (values.length < intervals) {
        const nextDateTime = moment(values[0].dateTime).add(valueDuration, 'minutes').toDate()
        values.unshift({
          dateTime: nextDateTime,
          value: 0
        })
      }

      // If hourly requested and raw telemetry is in minutes then batch data into hourly totals
      const hours = []
      if (valueDuration === 15) {
        batchData(values, hours)
      }

      const duration = valueDuration === 45 ? values : hours

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
        },
        hours: {
          latestDateTime: latestHourDateTime,
          values: duration
        }
      }
    }
  }
}

function batchData (values, hours) {
  let batchTotal = 0
  values.forEach(item => {
    const minutes = moment(item.dateTime).minutes()
    batchTotal += item.value
    if (minutes === 15) {
      const batchDateTime = moment(item.dateTime).add(45, 'minutes').toDate()
      hours.push({
        dateTime: batchDateTime,
        value: Math.round(batchTotal * 100) / 100
      })
      batchTotal = 0
    }
  })
}

function formatValue (val) {
  return parseFloat(Math.round(val * Math.pow(10, 1)) / (Math.pow(10, 1))).toFixed(1)
}

module.exports = ViewModel
