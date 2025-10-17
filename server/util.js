const moment = require('moment-timezone')
const ALLOWED_SEARCH_CHARS = 'a-zA-Z0-9\',-.& ()!'
const timezone = 'Europe/London'
const httpUtils = require('./http-utils') // Added to maintain backwards compatibility, can be removed once all references to http methods in this file are updated.

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

function formatRainfallValue (val, dp = 1) {
  return Number.isNaN(val) || val === null
    ? null
    : (Math.round(Number(val) * Math.pow(10, dp)) / Math.pow(10, dp)).toFixed(dp)
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

module.exports = {
  get: httpUtils.get,
  post: httpUtils.post,
  getJson: httpUtils.getJson,
  postJson: httpUtils.postJson,
  formatDate,
  formatElapsedTime,
  toFixed,
  groupBy,
  cleanseLocation,
  formatValue,
  toMarked,
  dateDiff,
  formatRainfallTelemetry,
  formatRainfallValue,
  rainfallTelemetryPadOut,
  ALLOWED_SEARCH_CHARS,
  removeSpikes
}
