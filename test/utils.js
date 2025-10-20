const Hapi = require('@hapi/hapi')
const { createSandbox } = require('sinon')
const { parse } = require('node-html-parser')

const util = require('../server/util')
const floodService = require('../server/services/flood')
const { formatRainfallValue } = require('../server/util')

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

describe('formatRainfallValue', () => {
  it('formats a number to 1 decimal place by default', () => {
    expect(formatRainfallValue(1.234)).toBe('1.2')
    expect(formatRainfallValue(2)).toBe('2.0')
  })

  it('formats a number to specified decimal places', () => {
    expect(formatRainfallValue(1.236, 2)).toBe('1.24')
    expect(formatRainfallValue(1.2, 3)).toBe('1.200')
  })

  it('returns null for NaN or null input', () => {
    expect(formatRainfallValue(NaN)).toBeNull()
    expect(formatRainfallValue(null)).toBeNull()
  })

  it('handles string numbers', () => {
    expect(formatRainfallValue('3.456')).toBe('3.5')
    expect(formatRainfallValue('3.456', 2)).toBe('3.46')
  })
})
