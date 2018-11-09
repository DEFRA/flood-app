const util = require('../util')
const config = require('../config')
const serviceUrl = config.serviceUrl

module.exports = {
  async getFloods () {
    const path = '/floods'
    const url = `${serviceUrl}${path}`
    return util.getJson(url)
  },

  async getFloodsWithin (bbox) {
    const path = '/floods-within'
    const url = `${serviceUrl}${path}/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`
    return util.getJson(url)
  },

  async getFloodArea (code) {
    // 5th character of code states "w" or "a"
    // for warning or alert flood area types
    const path = '/flood-area'
    const type = code.charAt(4).toLowerCase() === 'w'
      ? 'warning'
      : 'alert'

    const url = `${serviceUrl}${path}/${type}/${code}`
    return util.getJson(url)
  },

  async getOutlook () {
    const path = 'https://api.foursources.metoffice.gov.uk/api/public/statements/818.json'
    const url = `${path}`
    return util.getJson(url, true)
  }
}
