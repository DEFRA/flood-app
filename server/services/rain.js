const util = require('../util')

module.exports = {
  getRainGaugeById: (id) => {
    return util.getJson(`https://environment.data.gov.uk/flood-monitoring/id/stations/${id}`, true)
  },
  getRainMeasuresById: (id) => {
    return util.getJson(`https://environment.data.gov.uk/flood-monitoring/id/stations/${id}/readings?parameter=rainfall&_sorted&_limit=2800&_sorted`, true)
  }
}
