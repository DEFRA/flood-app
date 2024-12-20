const turf = require('@turf/turf')
const moment = require('moment-timezone')
const config = require('./config')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.httpTimeoutMs
})
const LocationSearchError = require('./location-search-error')
const ALLOWED_SEARCH_CHARS = 'a-zA-Z0-9\',-.& ()!'
const timezone = 'Europe/London'

async function request (method, url, options) {
  let res, payload

  const HTTP_STATUS_CODE_OK = 200

  try {
    const response = await wreck[method](url, options)
    res = response.res
    payload = response.payload
  } catch (error) {
    if (error?.message?.startsWith('Response Error:')) {
      error.message += ` on ${method.toUpperCase()} ${url.replace(/\?.*$/, '')}`
    }
    throw error
  }
  if (res.headers['x-ms-bm-ws-info'] === '1') {
    throw new LocationSearchError('Empty location search response indicated by header check of x-ms-bm-ws-info')
  }
  if (res.statusCode !== HTTP_STATUS_CODE_OK) {
    throw (payload || new Error('Unknown error'))
  }
  return payload
}

function get (url, options) {
  return request('get', url, options)
}

function post (url, options) {
  return request('post', url, options)
}

function postJson (url, options) {
  options = options || {}
  options.json = true
  return post(url, options)
}

function getJson (url) {
  return get(url, { json: true })
}

function formatDate (value, format = 'D/M/YY h:mma') {
  return moment(value).tz(timezone).format(format)
}

function formatElapsedTime (datetime) {
  const now = moment.tz(timezone)
  const diffMinutes = now.diff(moment.tz(datetime, timezone), 'minutes')

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`
  } else {
    return 'More than 1 hour ago'
  }
}

function toFixed (value, dp) {
  if (value) {
    const numberValue = parseFloat(value)

    if (isNaN(numberValue)) {
      return 'Invalid input. Please provide a valid number string.'
    }

    const factor = Math.pow(10, dp)
    const roundedValue = Math.round(numberValue * factor) / factor

    return roundedValue.toFixed(dp)
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

  return location
}

function removeSpikes (data) {
  const maxVal = 400
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
  const fifteenMinutes = 15
  const twoHours = 120
  const eightHours = 480

  const intervals = valueDuration === fifteenMinutes ? eightHours : twoHours
  while (values.length < intervals) {
    const nextDateTime = moment(values[0].dateTime).add(valueDuration, 'minutes').toDate()
    values.unshift({
      dateTime: nextDateTime,
      value: 0
    })
  }
  return values
}

function removeRepeatingEntries (inputString) {
  const itemsArray = inputString.split(',').map(item => item.trim())
  const uniqueItemsArray = [...new Set(itemsArray)]
  return uniqueItemsArray.join(', ')
}

function hasCityQualifier (itemsArray) {
  const regex = new RegExp(`^(Greater|City Of) ${itemsArray[0]}$`, 'i')
  return regex.test(itemsArray[1])
}

function removeCityQualifiers (inputString) {
  // remove qualifiers such as Greater London and City Of Portsmouth from the final entry in a place name
  // e.g. Camberwell, London, Greater London => Camberwell, London
  // e.g. London, Greater London => London
  const splitToken = ', '
  const itemsArray = inputString.split(splitToken)
  const length = itemsArray.length
  const penultimate = -2
  if (length >= 2 && hasCityQualifier(itemsArray.slice(penultimate))) {
    return itemsArray.slice(0, -1).join(splitToken)
  }
  return inputString
}

function formatName (name) {
  if (!name) {
    return ''
  }
  return removeCityQualifiers(removeRepeatingEntries(name))
}

module.exports = {
  get,
  post,
  getJson,
  postJson,
  request,
  formatDate,
  formatElapsedTime,
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
  removeSpikes
}
