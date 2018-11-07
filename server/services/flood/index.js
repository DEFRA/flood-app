const util = require('../../util')
const config = require('../../config')
const serviceUrl = config.serviceUrl

module.exports = {
  async getFloods () {
    const path = '/floods'
    const url = serviceUrl + path
    return util.getJson(url)
  },

  async getFloodsWithin (bbox) {
    const path = '/floods-within'
    const url = `${serviceUrl}${path}/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`
    return util.getJson(url)
  }
}
