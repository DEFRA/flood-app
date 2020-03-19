const joi = require('@hapi/joi')
const ViewModel = require('../models/views/target-area')
const floodService = require('../services/flood')

module.exports = {
  method: 'GET',
  path: '/target-area/{code}',
  handler: async (request, h) => {
    const { code } = request.params
    const { floods } = await floodService.getFloods()
    const area = await floodService.getFloodArea(code)
    const flood = floods.find(n => n.ta_code === code)
    const model = new ViewModel({ area, flood })
    return h.view('target-area', { model })
  },
  options: {
    validate: {
      params: joi.object({
        code: joi.string().required()
      }),
      query: joi.object({
        v: joi.string().optional(),
        btn: joi.string().optional(),
        lyr: joi.string().optional(),
        fid: joi.string().optional(),
        ext: joi.string().optional()
      })
    }
  }
}
