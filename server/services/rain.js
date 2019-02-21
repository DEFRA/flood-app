const util = require('../util')

module.exports = {
  async getRainGaugeById (id) {
    const url = `https://environment.data.gov.uk/flood-monitoring/id/stations/${id}`
    const result = await util.getJson(url, true)
    return result
  },
  async getRainMeasuresById (id) {
    const url = `https://environment.data.gov.uk/flood-monitoring/id/stations/${id}/readings?_limit=2800&_sorted`
    const result = await util.getJson(url, true)
    return result
  }
}
