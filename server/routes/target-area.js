const joi = require('joi')
const boom = require('boom')
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

      return h.view('target-area', { model })
    } catch (err) {
      return err.isBoom
        ? err
        : boom.badRequest('Failed to get target area', err)
    }
  },
  options: {
    validate: {
      params: {
        code: joi.string().required()
      }
    }
  }
}
