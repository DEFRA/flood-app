const turf = require('@turf/turf')
const moment = require('moment-timezone')
const config = require('./config')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.httpTimeoutMs
})

function request (method, url, options, ext = false) {
  return wreck[method](url, options)
    .then(response => {
      const res = response.res
      const payload = response.payload

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
  // Convert bbox into polygon, add buffer, and convert back to bbox as db query needs a bbox envelope
  return turf.bbox(turf.buffer(turf.bboxPolygon(bbox), m, { units: 'meters' }))
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
  addBufferToBbox
}
