const Hapi = require('@hapi/hapi')
const { parse } = require('node-html-parser')
const util = require('../server/util')
const floodService = require('../server/services/flood')
const { formatNumberToFixed, formatRainfallTelemetry } = require('../server/util')

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
  return {
    getJson: jest.spyOn(util, 'getJson').mockReturnValue(undefined),
    getFloods: jest.spyOn(floodService, 'getFloods').mockReturnValue(undefined),
    getOutlook: jest.spyOn(floodService, 'getOutlook').mockReturnValue(undefined),
    getIsEngland: jest.spyOn(floodService, 'getIsEngland').mockReturnValue(undefined),
    getStationById: jest.spyOn(floodService, 'getStationById').mockReturnValue(undefined),
    getFloodsWithin: jest.spyOn(floodService, 'getFloodsWithin').mockReturnValue(undefined),
    getImpactsWithin: jest.spyOn(floodService, 'getImpactsWithin').mockReturnValue(undefined),
    getStationsWithin: jest.spyOn(floodService, 'getStationsWithin').mockReturnValue(undefined),
    getWarningsAlertsWithinStationBuffer: jest.spyOn(floodService, 'getWarningsAlertsWithinStationBuffer').mockReturnValue(undefined),
    getRiversByName: jest.spyOn(floodService, 'getRiversByName').mockReturnValue(undefined)
  }
}

describe('formatNumberToFixed', () => {
  it('formats a number to 1 decimal place by default', () => {
    expect(formatNumberToFixed(1.234)).toBe('1.2')
    expect(formatNumberToFixed(2)).toBe('2.0')
  })

  it('formats a number to specified decimal places', () => {
    expect(formatNumberToFixed(1.236, 2)).toBe('1.24')
    expect(formatNumberToFixed(1.236, 3)).toBe('1.236')
  })

  it('returns null for NaN or null input', () => {
    expect(formatNumberToFixed(NaN)).toBeNull()
    expect(formatNumberToFixed(null)).toBeNull()
  })

  it('handles string numbers', () => {
    expect(formatNumberToFixed('3.456')).toBe('3.5')
    expect(formatNumberToFixed('3.456', 2)).toBe('3.46')
  })
})

describe('formatRainfallTelemetry', () => {
  it('maps null formatted values to Number.NaN', () => {
    const values = formatRainfallTelemetry([
      {
        value_timestamp: '2026-03-19T10:00:00.000Z',
        value: null
      }
    ], 60, 2)

    expect(values).toHaveLength(120)
    expect(Number.isNaN(values[values.length - 1].value)).toBeTrue()
  })
})
