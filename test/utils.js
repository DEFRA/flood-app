const Hapi = require('@hapi/hapi')
const { createSandbox } = require('sinon')
const { parse } = require('node-html-parser')

const util = require('../server/util')
const floodService = require('../server/services/flood')

module.exports.getPageTitle = (payload) => {
  return parse(payload).removeWhitespace().querySelector('title')?.text.trim()
}

module.exports.getCanonicalUrl = (payload) => {
  return parse(payload).querySelector('link[rel="canonical"]').getAttribute('href')
}

module.exports.initServer = async ({ name, route }) => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
      validate: {
        options: {
          abortEarly: false,
          stripUnknown: true
        }
      }
    }
  })

  await server.register(require('../server/plugins/views'))
  await server.register(require('../server/plugins/session'))
  await server.register(require('../server/plugins/logging'))
  require('../server/services/server-methods')(server)

  await server.register({
    plugin: {
      name,
      register: (svr) => {
        svr.route(route)
      }
    }
  })

  await server.initialize()

  return server
}

module.exports.initStubs = () => {
  const sandbox = createSandbox()

  return {
    sandbox,
    getJson: sandbox.stub(util, 'getJson'),
    getFloods: sandbox.stub(floodService, 'getFloods'),
    getOutlook: sandbox.stub(floodService, 'getOutlook'),
    getIsEngland: sandbox.stub(floodService, 'getIsEngland'),
    getStationById: sandbox.stub(floodService, 'getStationById'),
    getFloodsWithin: sandbox.stub(floodService, 'getFloodsWithin'),
    getImpactsWithin: sandbox.stub(floodService, 'getImpactsWithin'),
    getStationsWithin: sandbox.stub(floodService, 'getStationsWithin'),
    getWarningsAlertsWithinStationBuffer: sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer'),
    getRiversByName: sandbox.stub(floodService, 'getRiversByName')
  }
}
