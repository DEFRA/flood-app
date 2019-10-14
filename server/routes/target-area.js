const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const ViewModel = require('../models/views/target-area')
const floodService = require('../services/flood')

module.exports = {
  method: 'GET',
  path: '/target-area/{code}',
  handler: async (request, h) => {
    try {
      const { code } = request.params
      const { floods } = await floodService.getFloods()
      const area = await floodService.getFloodArea(code)
      const flood = floods.find(n => n.code === code)
      const model = new ViewModel({ area, flood })
      model.hasBackButton = Boolean(request.headers.referer)
      return h.view('target-area', { model })
    } catch (err) {
      console.log(err)
      return err.isBoom
        ? err
        : boom.badRequest('Failed to get target area', err)
    }
  },
  options: {
    validate: {
      params: {
        code: joi.string().required()
      },
      query: {
        v: joi.string().optional(),
        btn: joi.string().optional(),
        lyr: joi.string().optional(),
        fid: joi.string().optional(),
        ext: joi.string().optional()
      }
    }
  }
}
