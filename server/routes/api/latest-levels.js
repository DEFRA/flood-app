const joi = require('joi')
const severity = require('../../models/severity')
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

        const levels = thresholds ? getTargetAreaThresholds(thresholds) : []

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
