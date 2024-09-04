const joi = require('@hapi/joi')
const ViewModel = require('../models/views/target-area')

module.exports = {
  method: 'GET',
  path: '/target-area/{code}',
  handler: async (request, h) => {
    const { code } = request.params
    const { floods } = await request.server.methods.flood.getFloods()
    const area = await request.server.methods.flood.getFloodArea(code)
    const flood = floods.find(n => n.ta_code === code)
    const parentFlood = floods.find(n => n.ta_code === area.parent)
    const thresholds = flood ? await request.server.methods.flood.getTargetAreaThresholds(code) : []
    const model = new ViewModel({ area, flood, parentFlood, thresholds })
    return h.view('target-area', { model })
  },
  options: {
    validate: {
      params: joi.object({
        code: joi.string().required()
      }),
      query: joi.object({
        btn: joi.string(),
        ext: joi.string(),
        fid: joi.string(),
        lyr: joi.string(),
        v: joi.string()
      })
    }
  }
}
