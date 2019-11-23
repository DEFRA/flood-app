const rainService = require('../services/rain')
const config = require('../config')
const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/rain-gauge')
const HttpsProxyAgent = require('https-proxy-agent')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.restClientTimeoutMillis
})

let wreckExt
if (config.httpsProxy) {
  wreckExt = require('@hapi/wreck').defaults({
    timeout: config.httpTimeoutMs,
    agent: new HttpsProxyAgent(config.httpsProxy)
  })
}

// const rainfallApiUri = config.rainfallApiUrl

module.exports = [{
  method: 'GET',
  path: '/rain-gauge/{id}',
  handler: async (request, h) => {
    const id = request.params.id
    try {
      const rainGauge = await rainService.getRainGaugeById(id)
      const rainMeasures = await rainService.getRainMeasuresById(id)
      if (!(rainGauge && rainMeasures)) {
        return boom.notFound('No rain gauge found')
      }
      const model = new ViewModel(rainGauge, rainMeasures)
      model.referer = request.headers.referer
      return h.view('rain-gauge', { model })
    } catch (err) {
      return err.isBoom
        ? err
        : boom.badRequest('Failed to get rain gauge', err)
    }
  }
},
{
  method: 'GET',
  path: '/rain-gauge-tooltip/{id}/{label}/{readingsLimit?}',
  handler: async (request, h) => {
    // Reset session. TODO: refactor if necessary
    request.yar.reset()
    const { id, label, readingsLimit } = request.params
    // const url = rainfallApiUri + '/id/stations/' + id

    let readingsUrl = 'https://environment.data.gov.uk/flood-monitoring/id/stations/' + id + '/readings?parameter=rainfall&_sorted'
    if (readingsLimit) {
      readingsUrl += '&_limit=' + readingsLimit
    } else {
      readingsUrl += '&_limit=' + 25
    }
    try {
      const thisWreck = wreckExt || wreck
      // const { res, payload } = await wreck.get(readingsUrl, { json: true })
      const { res, payload } = await thisWreck.get(readingsUrl, { json: true })
      payload.label = label

      if (res.statusCode !== 200 || payload.items.length === 0 || payload.items === undefined) {
        const error = 'No rain gauge station information found'
        throw error
      }

      let latestDailyRainfallTotal = 0
      const sixHourArray = []
      const dayArray = []
      const monthArray = []
      let cumHourlyValue = 0
      let cumDailyValue = 0
      let latestDate = ''
      let earliestDate = ''

      if (payload.items !== undefined && payload.items.length > 0) {
        latestDate = payload.items[0].dateTime
        earliestDate = payload.items[payload.items.length - 1].dateTime

        for (let i = 0; i < payload.items.length; i++) {
          // If there is no value for a particular day then force 0. TODO: Investigate if this should error instead
          if (!payload.items[i].value) {
            payload.items[i].value = 0
          }

          if (i < 97) {
            latestDailyRainfallTotal += payload.items[i].value
          }

          if (i < 24) {
            sixHourArray.push(payload.items[i].value)
          }

          // Calculate hourly values for displaying latest day
          if (i % 4 === 0 && dayArray.length < 24) {
            dayArray.push(cumHourlyValue)
            cumHourlyValue = 0
          }

          if (i % 96 === 0) {
            monthArray.push(cumDailyValue)
            cumDailyValue = 0
          }
          cumHourlyValue += payload.items[i].value
          cumDailyValue += payload.items[i].value
        }

        // If latestDailyRainfallTotal is not an integer then round up to 1 decimal place.
        if (!Number.isInteger(latestDailyRainfallTotal)) {
          latestDailyRainfallTotal = Math.round(latestDailyRainfallTotal * 10) / 10
        }
      }

      request.yar.set('rainGaugeReadings', {
        stationId: id,
        latestDate: latestDate,
        earliestDate: earliestDate,
        dailyTotal: latestDailyRainfallTotal,
        sixHourArray: sixHourArray,
        dayArray: dayArray,
        monthArray: monthArray
      })

      return request.yar.get('rainGaugeReadings')
    } catch (err) {
      return err.isBoom
        ? err
        : boom.badRequest('Failed to get rain gauge station', err)
    }
  },
  options: {
    validate: {
      params: joi.object({
        id: joi.string().required(),
        label: joi.string(),
        readingsLimit: joi.number()
      }),
      query: joi.object({
        direction: joi.string().valid('d', 'u').default('u')
      })
    }
  }
}]
