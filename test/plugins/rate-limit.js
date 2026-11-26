'use strict'

const Hapi = require('@hapi/hapi')

describe('Plugin - Rate Limit', () => {
  let server
  let config

  beforeEach(async () => {
    config = require('../../server/config')
    const floodService = require('../../server/services/flood')

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })

    jest.replaceProperty(config, 'rateLimitExpiresIn', 1)
    jest.replaceProperty(config, 'rateLimitRequests', 1)
    jest.replaceProperty(config, 'rateLimitWhitelist', ['1.1.1.1', '2.2.2.2'])

    const fakeStationData = () => {
      return {
        rloi_id: 5146,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '1146588',
        telemetry_id: '713030',
        wiski_id: '713030',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Ribble Douglas and Crossens',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        location_info: 'Preston',
        x_coord_actual: 355230,
        y_coord_actual: 428720,
        actual_ngr: '',
        x_coord_display: 355230,
        y_coord_display: 428720,
        site_max: '5',
        wiski_river_name: 'River Ribble',
        date_open: '2001-01-01T00:00:00.000Z',
        stage_datum: '3.642',
        period_of_record: 'to date',
        por_max_value: '5.488',
        date_por_max: '2020-02-09T18:15:00.000Z',
        highest_level: '3.469',
        date_highest_level: '2012-09-26T01:15:00.000Z',
        por_min_value: '-0.07',
        date_por_min: '2009-04-22T12:45:00.000Z',
        percentile_5: '3.5',
        percentile_95: '0.15',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeForecastFlag = () => {
      return {
        station_display_time_series_id: '94280',
        station_id: '8208',
        direction: 'u',
        display_time_series: false
      }
    }

    jest.spyOn(floodService, 'getForecastFlag').mockImplementation(fakeForecastFlag)
    jest.spyOn(floodService, 'getStationById').mockImplementation(fakeStationData)
    jest.spyOn(floodService, 'getStationTelemetry').mockImplementation(() => [])
    jest.spyOn(floodService, 'getStationImtdThresholds').mockImplementation(() => [])
    jest.spyOn(floodService, 'getImpactData').mockImplementation(() => [])
    jest.spyOn(floodService, 'getWarningsAlertsWithinStationBuffer').mockImplementation(() => [])
    jest.spyOn(floodService, 'getRiverStationByStationId').mockImplementation(() => [])

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
  })

  afterEach(async () => {
    jest.resetModules()

    await server.stop()
  })

  it('should GET station page exceeding rate-limit', async () => {
    jest.replaceProperty(config, 'localCache', true)
    jest.replaceProperty(config, 'rateLimitEnabled', true)

    await server.register(require('../../server/plugins/rate-limit'))

    await server.register({
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    })

    require('../../server/services/server-methods')(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)

    const response2 = await server.inject(options)

    expect(response2.statusCode).toBe(429)
  })

  it('should GET station page with rate-limit disabled', async () => {
    jest.replaceProperty(config, 'localCache', true)
    jest.replaceProperty(config, 'rateLimitEnabled', false)

    await server.register(require('../../server/plugins/error-pages'))

    await server.register({
      plugin: {
        name: 'station',
        register: (server) => {
          server.route(require('../../server/routes/station'))
        }
      }
    })

    require('../../server/services/server-methods')(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)

    const response2 = await server.inject(options)

    expect(response2.statusCode).toBe(200)
  })

  it('should set the cache setting "userPathCache"', async () => {
    jest.replaceProperty(config, 'localCache', false)
    jest.replaceProperty(config, 'rateLimitEnabled', true)

    const rateLimit = require('../../server/plugins/rate-limit.js')

    expect(rateLimit.options.userCache.cache).toBe('redis_cache')
  })
})
