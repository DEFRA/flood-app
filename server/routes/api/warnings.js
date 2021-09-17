const Joi = require('@hapi/joi')
const Floods = require('../../models/floods')
const floodsMessage = require('../../models/floods-message')
const locationService = require('../../services/location')
const util = require('../../util')

module.exports = {
  method: 'GET',
  path: '/api/warnings',
  options: {
    description: 'Get warnings data by location (api for LTFRI)',
    handler: async request => {
      const location = util.cleanseLocation(request.query.location)
      let data, place
      if (location) {
        place = await locationService.find(util.cleanseLocation(location))
      }

      if (place) {
        data = await request.server.methods.flood.getFloodsWithin(place.bbox2k)
      } else {
        data = await request.server.methods.flood.getFloods()
      }

      const floods = new Floods(data)
      return {
        address: place ? place.address : 'England',
        floods: floods.floods,
        severity: floods.highestSeverityId,
        message: floodsMessage(floods, (!!place))
      }
    },
    app: {
      useErrorPages: false
    },
    validate: {
      query: Joi.object({
        location: Joi.string().allow('')
      })
    }
  }
}
