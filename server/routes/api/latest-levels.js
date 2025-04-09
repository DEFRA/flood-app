const joi = require('joi')
const severity = require('../../models/severity')
const { toFixed, formatElapsedTime } = require('../../util')
const getTargetAreaThresholds = require('../../models/views/lib/latest-levels')

module.exports = {
  method: 'GET',
  path: '/api/latest-levels/{code}',
  options: {
    description: 'Get RLOI refresh data (15 minute intervals)',
    handler: async request => {
      const { code } = request.params

      try {
        const thresholds = await request.server.methods.flood.getTargetAreaThresholds(code)
        const { floods } = await request.server.methods.flood.getFloods()

        const flood = floods.find(n => n.ta_code === code)

        const severityLevel = flood && severity.filter(item => item.id === flood.severity_value)[0]

        const levels = thresholds
          ? getTargetAreaThresholds(thresholds).map(item => {
            return {
              rloi_id: item.rloi_id,
              river_name: item.river_name,
              agency_name: item.agency_name,
              latest_level: toFixed(item.latest_level, 2),
              threshold_value: toFixed(item.threshold_value, 2),
              isSuspendedOrOffline: item.status === 'Suspended' || (item.status === 'Active' && item.latest_level === null),
              value_timestamp: formatElapsedTime(item.value_timestamp)
            }
          })
          : []

        return {
          severity: severityLevel?.hash,
          levels
        }
      } catch (err) {
        console.error(err)

        return {
          levels: [],
          severity: null
        }
      }
    },
    app: {
      useErrorPages: false
    },
    validate: {
      params: joi.object({
        code: joi.string().required()
      })
    }
  }
}
