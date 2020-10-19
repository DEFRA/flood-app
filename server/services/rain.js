const util = require('../util')
const { rainfallApiUrl } = require('../config')

module.exports = {
  getRainGaugeById: (id) => {
    return util.getJson(`${rainfallApiUrl}/id/stations/${id}`, true)
  },
  getRainMeasuresById: (id) => {
    return util.getJson(`${rainfallApiUrl}/id/stations/${id}/readings?parameter=rainfall&_sorted&_limit=2800&_sorted`, true)
  }
}
