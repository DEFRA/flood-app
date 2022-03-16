const moment = require('moment-timezone')
const tz = 'Europe/London'
const config = require('../../config')
const util = require('../../util')

class ViewModel {
  constructor (rainfallStationTelemetry, rainfallStation) {
    const stationName = rainfallStation[0].station_name.replace(/(^\w|\s\w)(\S*)/g, (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase())
    Object.assign(this, {
      stationName: stationName,
      pageTitle: 'Rainfall at ' + stationName + ' gauge',
      postTitle: 'Latest rainfall information at ' + stationName + ' gauge',
      metaDescription: 'Check the latest recorded rainfall at ' + stationName + ' gauge',
      metaCanonical: '/',
      telemetry: rainfallStationTelemetry || [],
      floodRiskUrl: config.floodRiskUrl,
      bingMaps: config.bingKeyMaps,
      stationId: rainfallStation[0].station_reference,
      centroid: [rainfallStation[0].lon, rainfallStation[0].lat],
      region: rainfallStation[0].region,
      planAhead: 'Rainfall:Related-content:Plan-ahead-for-flooding',
      whatToDO: 'Rainfall:Related-content:What-to-do-in-a-flood',
      recoverAfter: 'Rainfall:Related-content:Recover-after-a-flood',
      longTerm: 'Rainfall:Related-content:Check-long-term-risk',
      reportFlood: 'Rainfall:Related-content:Report-a-flood',
      twitterEvent: 'Rainfall:Share Page:Rainfall - Share to Twitter',
      facebookEvent: 'Rainfall:Share Page:Rainfall - Share to Facebook',
      emailEvent: 'Rainfall:Share Page:Rainfall - Share to email'
    })

    if (this.telemetry.length) {
      const now = moment().tz(tz).format()
      const fiveDaysAgo = moment().subtract(5, 'days').format()
      const latestDateTime = this.telemetry[0].value_timestamp
      this.latestDayFormatted = moment(latestDateTime).tz(tz).format('Do MMMM')
      this.latestTimeFormatted = moment(latestDateTime).tz(tz).format('h:mma')
      this.outOfDate = lastDataRefresh(this.telemetry[0].value_timestamp)
      const dataStartDateTime = fiveDaysAgo
      const rangeStartDateTime = fiveDaysAgo
      const dataEndDateTime = now
      const rangeEndDateTime = now
      const latest1hr = util.formatValue(rainfallStation[0].one_hr_total)
      const latest6hr = util.formatValue(rainfallStation[0].six_hr_total)
      const latest24hr = util.formatValue(rainfallStation[0].day_total)
      const valueDuration = this.telemetry[0].period === '15 min' ? 15 : 45
      this.id = `${this.stationId}.${this.region}`
      const latestHourDateTime = moment(latestDateTime).add(45, 'minutes').minutes(0).seconds(0).milliseconds(0).toDate()

      // Remove unecessary properties
      let values = this.telemetry.map(data => {
        return {
          dateTime: data.value_timestamp,
          value: Number(util.formatValue(data.value))
        }
      })

      values = util.rainfallTelemetryPadOut(values, valueDuration)

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
