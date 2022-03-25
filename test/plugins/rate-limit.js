'use strict'

const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const lab = exports.lab = Lab.script()
const Code = require('@hapi/code')
const sinon = require('sinon')
const config = require('../../server/config')

lab.experiment('rate-limit plugin test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
    sandbox.stub(config, 'localCache').value(true)
    sandbox.stub(config, 'rateLimitEnabled').value(true)
    sandbox.stub(config, 'rateLimitExpiresIn').value(1)
    sandbox.stub(config, 'rateLimitRequests').value(1)
    sandbox.stub(config, 'rateLimitWhitelist').value(['1.1.1.1', '2.2.2.2'])
    await server.register(require('../../server/plugins/rate-limit'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.res
  })

  lab.test('Plugin rate-limit successfully loads local cache true', async () => {
  })

  lab.test('GET station page exceeding rate-limit ', async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/station.js')]
    const floodService = require('../../server/services/flood')

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
        status: 'Closed',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeTelemetryData = () => []

    const fakeImpactsData = () => []
    const fakeThresholdsData = () => []
    const fakeWarningsAlertsData = () => []
    const fakeRiverStationData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getStationForecastThresholds').callsFake(fakeThresholdsData)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeWarningsAlertsData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverStationData)

    const stationPlugin = {
      plugin: {
        name: 'station',
        register: (server, options) => {
          server.route(require('../../server/routes/station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(stationPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    const response2 = await server.inject(options)

    Code.expect(response2.statusCode).to.equal(429)
  })
})
