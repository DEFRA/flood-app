
'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Test - /station/{id}', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/routes/station.js')]
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })
  lab.test('GET station/5146 ', async () => {
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
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.68044442027032,53.7529105624953]}',
        geography: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-ribble',
        river_name: 'River Ribble',
        navigable: true,
        view_rank: 3,
        rank: 9,
        rloi_id: 5146,
        up: 5122,
        down: null,
        telemetry_id: '713030',
        region: 'North West',
        catchment: 'Ribble Douglas and Crossens',
        wiski_river_name: 'River Ribble',
        agency_name: 'Walton-Le-Dale',
        external_name: 'Walton-Le-Dale',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.567',
        value_timestamp: '2020-03-17T04:30:00.000Z',
        value_erred: false,
        percentile_5: '3.5',
        percentile_95: '0.15',
        centroid: '0101000020E61000001A741ED88C7105C0755D915F5FE04A40',
        lon: -2.68044442027032,
        lat: 53.7529105624953
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeImpactsData = () => []
    const fakeThresholdsData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getRiverStationByStationId').callsFake(fakeRiverData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getImpactData').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getStationForecastThresholds').callsFake(fakeThresholdsData)

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

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/station/5146'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('River level at Walton-Le-Dale (River Ribble) - GOV.UK')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=river-ribble" class="defra-river-nav-link">River Ribble</a>')
  })
})
