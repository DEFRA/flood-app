const turf = require('@turf/turf')
const moment = require('moment-timezone')
const config = require('./config')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.httpTimeoutMs
})
const LocationSearchError = require('./location-search-error')
const ALLOWED_SEARCH_CHARS = 'a-zA-Z0-9\',-.& ()'

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
    const re = new RegExp(`[^${ALLOWED_SEARCH_CHARS}]`, 'g')
    return location.replace(re, '')
  }
}

function rmAnomalys (data) {
  const anomalyVal = 100
  const avg = data.reduce((a, b) => a + b._, 0) / data.length
  const maxVal = avg * anomalyVal
  return data.filter(el => el._ < maxVal)
}

function addBufferToBbox (bbox, m) {
  // Convert bbox (binding box) )into polygon, add buffer, and convert back to bbox as db query needs a bbox envelope
  return turf.bbox(turf.buffer(turf.bboxPolygon(bbox), m, { units: 'meters' }))
}

function formatValue (val) {
  return parseFloat(Math.round(val * Math.pow(10, 1)) / (Math.pow(10, 1))).toFixed(1)
}

function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

function toMarked (string, find) {
  const reg = new RegExp(`(${escapeRegExp(find)})`, 'gi')
  return string.replace(reg, '<mark>$1</mark>')
}

function dateDiff (date1, date2) {
  return moment(date1).diff(moment(date2), 'days')
}

function formatRainfallTelemetry (telemetry, valueDuration) {
  let values = telemetry.map(data => {
    return {
      dateTime: data.value_timestamp,
      value: Number(formatValue(data.value))
    }
  })
  values = rainfallTelemetryPadOut(values, valueDuration)
  return values
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

function formatName (name = '', addressLine = undefined) {
  // Note: We assume Bing is consitent in it's capitalisation of terms so we don't lower case them
  // (i.e. 'Durham, durham' will not occur in the real world)

  return name
    .split(/,\s*/)
  // Strip out addressLine to make name returned more ambiguous as we're not giving property specific information
    .filter(part => !(addressLine && part === addressLine))
  // remove repeated words
    .filter((part, index, allParts) => part !== allParts[index + 1])
    .filter(part => part !== 'United Kingdom')
    .join(', ')
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
  formatName,
  toMarked,
  dateDiff,
  formatRainfallTelemetry,
  rainfallTelemetryPadOut,
  ALLOWED_SEARCH_CHARS,
  rmAnomalys
}
