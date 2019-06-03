const util = require('../util')
const config = require('../config')
const serviceUrl = config.serviceUrl

// Temporary statement cache
let cachedOutlook = null

const setOutlook = (outlook) => {
  cachedOutlook = outlook
  // Clear after 5 mins
  setTimeout(() => { cachedOutlook = null }, 5 * 60 * 1000)
  return outlook
}

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

    const url = `${serviceUrl}/flood-area/${type}/${code}`
    return util.getJson(url)
  },

  async getOutlook () {
    // const url = `${serviceUrl}/outlook`
    // return util.getJson(url)

    // Until we get the FGS feed sorted and returned from
    // the service, use a temporary cache as this call is slow.
    if (cachedOutlook) {
      return Promise.resolve(cachedOutlook)
    } else {
      const url = `https://api.ffc-environment-agency.fgs.metoffice.gov.uk/api/public/statements`
      const result = await util.getJson(url, true)
      return setOutlook(result.statements[0])
    }
  },

  async getStationById (id, direction) {
    const url = `${serviceUrl}/station/${id}/${direction}`
    return util.getJson(url)
  },

  async getStationsWithin (bbox) {
    const url = `${serviceUrl}/stations-within/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`
    return util.getJson(url)
  },

  async getStationsUpstreamDownstream (id, direction) {
    const url = `${serviceUrl}/stations-upstream-downstream/${id}/${direction}`
    let result = await util.getJson(url)
    return result
  },

  async getStationsWithinRadius (lng, lat, radiusM = 10000) {
    const url = `${serviceUrl}/stations-within/${lng}/${lat}/${radiusM}`
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
  },

  async getIsEngland (lng, lat) {
    const url = `${serviceUrl}/is-england/${lng}/${lat}`
    return util.getJson(url)
  },
  async getImpactData (id) {
    const url = `${serviceUrl}/impacts/${id}`
    return util.getJson(url)
  },
  async getImpactsWithin (bbox) {
    const url = `${serviceUrl}/impacts-within/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`
    return util.getJson(url)
  }
}
