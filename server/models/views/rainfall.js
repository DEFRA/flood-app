const { date } = require('@hapi/joi')
const moment = require('moment-timezone')
const tz = 'Europe/London'
const config = require('../../config')


class ViewModel {
  constructor (rainfallStation, rainfallStationTotal) {
    Object.assign(this, {
      pageTitle: 'Check for flooding in England',
      metaDescription:
        'View current flood warnings and alerts for England and the national flood forecast for the next 5 days. Also check river, sea, groundwater and rainfall levels.',
      metaCanonical: '/',
      stationName: rainfallStationTotal[0].station_name.replace(/(^\w|\s\w)(\S*)/g, (_,m1,m2) => m1.toUpperCase()+m2.toLowerCase()),
      telemetry: rainfallStation || [],
      bingMaps: config.bingKeyMaps,
      stationId: rainfallStationTotal[0].station_reference,
      centroid: rainfallStationTotal[0].centroid,
      region: rainfallStationTotal[0].region
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
      const valueDuration = this.telemetry[0].period === '15 min' ? 15 : 45
      this.id = this.stationId + "." + this.region
      const latestHourDateTime = moment(latestDateTime).add(45, 'minutes').minutes(0).seconds(0).milliseconds(0).toDate()

      const intervals = valueDuration === 15 ? 480 : 120

      // Extend telemetry upto latest interval, could be 15 or 60 minute intervals
      while(this.telemetry.length < intervals) {
        const nextDateTime = moment(this.telemetry[0].value_timestamp).add(valueDuration, 'minutes').toDate()
        this.telemetry.unshift({
          value_timestamp: nextDateTime,
          value: 0
        })
      }

      const values = this.telemetry.map(data => {
        return {
          dateTime: data.value_timestamp,
          value: data.value
        }
      })

      // If hourly requested and raw telemetry is in minutes then batch data into hourly totals
    const hours = []
    if (valueDuration === 15) {
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

    
    const duration = valueDuration === 45 ? values : hours 


      values.sort((a, b) => b.dateTime - a.dateTime)

      // const test = values.map(data => {
      //   return {
      //     dateTime: data.value_timestamp,
      //     value: data.value
      //   }
      // })

      
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

module.exports = ViewModel
