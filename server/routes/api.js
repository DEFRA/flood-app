const joi = require('joi')
const locationService = require('../services/location')

const config = require('../config')
const uri = config.geoserverUrl + '/geoserver/flood/ows'

module.exports = [{
  method: 'GET',
  path: '/suggest',
  handler: (request, h) => {
    return locationService.suggest(request.query.q)
  },
  options: {
    description: 'Autosuggest / autocomplete',
    validate: {
      query: {
        q: joi.string().required()
      }
    }
  }
}, {
  method: 'GET',
  path: '/ows',
  handler: {
    proxy: {
      mapUri: function (request) {
        const url = uri + request.url.search
        return { uri: url }
      },
      passThrough: true
    }
  },
  options: {
    description: 'Proxy requests bound for Geoserver'
  }
}]
