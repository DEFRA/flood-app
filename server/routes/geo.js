const joi = require('joi')
const floods = require('../data/floods')
const floodAreas = require('../data/flood-areas')
const locationService = require('../services/location')

const config = require('../config')
const uri = config.geoserverUrl + '/geoserver/flood/ows'

module.exports = [{
  method: 'GET',
  path: '/flood-areas.geojson',
  handler: (request, h) => {
    return floodAreas
  }
}, {
  method: 'GET',
  path: '/floods.geojson',
  handler: (request, h) => {
    return floods
  }
}, {
  method: 'GET',
  path: '/flood-areas/{id}/polygon.geojson',
  handler: {
    proxy: {
      uri: 'http://environment.data.gov.uk/flood-monitoring/id/floodAreas/{id}/polygon'
    }
  }
}, {
  method: 'GET',
  path: '/stations.geojson',
  handler: {
    file: {
      path: 'server/data/stations.json'
    }
  }
}, {
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
