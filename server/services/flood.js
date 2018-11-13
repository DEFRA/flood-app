const util = require('../util')
const config = require('../config')
const serviceUrl = config.serviceUrl

module.exports = {
  async getFloods () {
    const url = `${serviceUrl}/floods`
    return util.getJson(url)
  },

  async getFloodsWithin (bbox) {
    const url = `${serviceUrl}/floods-within/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`
    return util.getJson(url)
  },

  async getFloodArea (code) {
    // 5th character of code states "w" or "a"
    // for warning or alert flood area types
    const type = code.charAt(4).toLowerCase() === 'w'
      ? 'warning'
      : 'alert'

    const url = `${serviceUrl}'/flood-area'/${type}/${code}`
    return util.getJson(url)
  },

  async getOutlook () {
    const url = 'https://api.foursources.metoffice.gov.uk/api/public/statements/818.json'
    return util.getJson(url, true)
  },

  async getStationById (id, direction) {
    const url = `${serviceUrl}/station/${id}/${direction}`
    return util.getJson(url)
  },

  async getStationTelemetry (id, direction) {
    const url = `${serviceUrl}/station/${id}/${direction}/telemetry`
    return util.getJson(url)
  },

  async getStationForecastThresholds (id) {
    const url = `${serviceUrl}/station/${id}/forecast/thresholds`
    return util.getJson(url)
  },

  async getStationForecastData (id) {
    const url = `${serviceUrl}/station/${id}/forecast/data`
    return util.getJson(url)
  }
}
