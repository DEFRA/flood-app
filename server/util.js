const turf = require('@turf/turf')
const moment = require('moment-timezone')
const config = require('./config')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.httpTimeoutMs
})
const LocationSearchError = require('./location-search-error')

function request (method, url, options, ext = false) {
  return wreck[method](url, options)
    .then(response => {
      const res = response.res
      const payload = response.payload
      if (res.headers['x-ms-bm-ws-info'] === '1') {
        throw new LocationSearchError('Empty location search response indicated by header check of x-ms-bm-ws-info')
      }
      if (res.statusCode !== 200) {
        const err = (payload || new Error('Unknown error'))
        throw err
      }
      return payload
    })
}

function get (url, options, ext = false) {
  return request('get', url, options, ext)
}

function post (url, options) {
  return request('post', url, options)
}

function postJson (url, options) {
  options = options || {}
  options.json = true
  return post(url, options)
}

function getJson (url, ext = false) {
  return get(url, { json: true }, ext)
}

function formatDate (value, format = 'D/M/YY h:mma') {
  return moment(value).tz('Europe/London').format(format)
}

function toFixed (value, dp) {
  if (value) {
    return Number(Math.round(value + 'e' + dp) + 'e-' + dp).toFixed(dp)
  } else {
    return value
  }
}

function groupBy (arr, prop) {
  return arr.reduce(function (groups, item) {
    const val = item[prop]
    groups[val] = groups[val] || []
    groups[val].push(item)
    return groups
  }, {})
}

function cleanseLocation (location) {
  if (location) {
    return location.replace(/[^a-zA-Z0-9',-.& ]/g, '')
  }
}

function addBufferToBbox (bbox, m) {
  // Convert bbox (binding box) )into polygon, add buffer, and convert back to bbox as db query needs a bbox envelope
  return turf.bbox(turf.buffer(turf.bboxPolygon(bbox), m, { units: 'meters' }))
}

function formatValue (val) {
  return parseFloat(Math.round(val * Math.pow(10, 1)) / (Math.pow(10, 1))).toFixed(1)
}

function dateDiff (date1, date2) {
  return moment(date1).diff(moment(date2), 'days')
}

function rainfallTelemetryPadOut (values, valueDuration) {
  // Extend telemetry upto latest interval, could be 15 or 60 minute intervals
  const intervals = valueDuration === 15 ? 480 : 120
  while (values.length < intervals) {
    const nextDateTime = moment(values[0].dateTime).add(valueDuration, 'minutes').toDate()
    values.unshift({
      dateTime: nextDateTime,
      value: 0
    })
  }
  return values
}

module.exports = {
  get,
  post,
  getJson,
  postJson,
  request,
  formatDate,
  toFixed,
  groupBy,
  cleanseLocation,
  addBufferToBbox,
  formatValue,
  dateDiff,
  rainfallTelemetryPadOut
}
