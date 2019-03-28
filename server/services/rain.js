const util = require('../util')

module.exports = {
  getRainGaugeById: async (id) => {
    const url = `https://environment.data.gov.uk/flood-monitoring/id/stations/${id}`
    const result = await util.getJson(url, true)
    return result
  },
  getRainMeasuresById: async (id) => {
    const url = `https://environment.data.gov.uk/flood-monitoring/id/stations/${id}/readings?parameter=rainfall&_sorted&_limit=2800&_sorted`
    const result = await util.getJson(url, true)
    return result
  }
}
