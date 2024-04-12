const moment = require('moment-timezone')
const tz = 'Europe/London'
const config = require('../../config')
const util = require('../../util')

class ViewModel {
  constructor (rainfallStationTelemetry, rainfallStation) {
    const stationName = rainfallStation
      .station_name
      .replace(/(^\w|\s\w)(\S*)/g, (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase())

    Object.assign(this, {
      stationName,
      pageTitle: `Rainfall at ${stationName} gauge`,
      postTitle: `Latest rainfall information at ${stationName} gauge`,
      metaDescription: `Check the latest recorded rainfall at ${stationName} gauge`,
      metaCanonical: '/',
      telemetry: rainfallStationTelemetry || [],
      floodRiskUrl: config.floodRiskUrl,
      bingMaps: config.bingKeyMaps,
      stationId: rainfallStation.station_reference,
      centroid: [rainfallStation.lon, rainfallStation.lat],
      region: rainfallStation.region,
      displayGetWarningsLink: true,
      displayLongTermLink: true
    })

    if (this.telemetry.length) {
      const now = moment().tz(tz).format()
      const fiveDaysAgo = moment().subtract(5, 'days').format()
      const latestDateTime = this.telemetry[0].value_timestamp
      this.latestDayFormatted = moment(latestDateTime).tz(tz).format('D MMMM')
      this.latestTimeFormatted = moment(latestDateTime).tz(tz).format('h:mma')
      this.outOfDate = lastDataRefresh(this.telemetry[0].value_timestamp)
      const dataStartDateTime = fiveDaysAgo
      const rangeStartDateTime = fiveDaysAgo
      const dataEndDateTime = now
      const rangeEndDateTime = now
      const latest1hr = util.formatValue(rainfallStation.one_hr_total)
      const latest6hr = util.formatValue(rainfallStation.six_hr_total)
      const latest24hr = util.formatValue(rainfallStation.day_total)
      const valueDuration = this.telemetry[0].period === '15 min' ? 15 : 45
      this.id = `${this.stationId}.${this.region}`
      const latestHourDateTime = moment(latestDateTime).add(45, 'minutes').minutes(0).seconds(0).milliseconds(0).toDate()

      const values = util.formatRainfallTelemetry(this.telemetry, valueDuration)

      // If hourly requested and raw telemetry is in minutes then batch data into hourly totals

      const hours = []

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
        hours: {
          latestDateTime: latestHourDateTime,
          values: duration
        }
      }

      if (valueDuration === 15) {
        batchData(values, hours)
        this.telemetryRainfall.minutes = {
          latestDateTime,
          values
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

function lastDataRefresh (lastDate) {
  const days = util.dateDiff(Date.now(), lastDate)

  if (days > 1 && days < 6) {
    return 'problem'
  } else if (days > 5 && days < 31) {
    return 'offline'
  } else if (days > 30) {
    return 'closed'
  } else {
    return ''
  }
}

module.exports = ViewModel
