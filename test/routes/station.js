
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
  lab.test('GET station/5146 with Normal river level ', async () => {
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
        value: '9.567',
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
    Code.expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    Code.expect(response.payload).to.contain('defra-flood-statistics__impact defra-flood-statistics__impact--normal')
    Code.expect(response.payload).to.contain('Normal')
    Code.expect(response.payload).to.contain('0.15m to 3.50m typical')
    Code.expect(response.payload).to.contain('<time datetime="">1:30am</time>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=river-ribble" class="defra-river-nav-link">River Ribble</a>')
  })
  lab.test('GET station/2042/downstream ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 2042,
        station_type: 'M',
        qualifier: 'd',
        telemetry_context_id: '1145946',
        telemetry_id: '2088',
        wiski_id: '2088',
        post_process: false,
        subtract: null,
        region: 'Midlands',
        area: 'Staffordshire Warwickshire and West Midlands',
        catchment: 'Warwickshire Avon',
        display_region: 'Midlands',
        display_area: '',
        display_catchment: '',
        agency_name: 'Lilbourne',
        external_name: 'Lilbourne',
        location_info: 'Lilbourne',
        x_coord_actual: 456360,
        y_coord_actual: 277780,
        actual_ngr: '',
        x_coord_display: 456360,
        y_coord_display: 277780,
        site_max: '3',
        wiski_river_name: 'River Avon',
        date_open: '1972-04-26T23:00:00.000Z',
        stage_datum: '92.6',
        period_of_record: 'to date',
        por_max_value: '1.774',
        date_por_max: '2007-03-03T08:30:00.000Z',
        highest_level: '1.77',
        date_highest_level: '2012-11-25T10:45:00.000Z',
        por_min_value: '-0.346',
        date_por_min: '2015-07-07T18:15:00.000Z',
        percentile_5: '0.666',
        percentile_95: '-0.255',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-1.17316039381184,52.3951465511329]}',
        geography: '0101000020E61000003F2646D543C5F2BF161F852994324A40',
        centroid: '0101000020E61000003F2646D543C5F2BF161F852994324A40'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'river-avon-warwickshire',
        river_name: 'River Avon',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 2042,
        up: null,
        down: 2043,
        telemetry_id: '2088',
        region: 'Midlands',
        catchment: 'Warwickshire Avon',
        wiski_river_name: 'River Avon',
        agency_name: 'Lilbourne',
        external_name: 'Lilbourne',
        station_type: 'M',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.341',
        value_timestamp: '2020-03-18T08:00:00.000Z',
        value_erred: false,
        percentile_5: '0.659',
        percentile_95: '0.098',
        centroid: '0101000020E61000003F2646D543C5F2BF161F852994324A40',
        lon: -1.17316039381184,
        lat: 52.3951465511329
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
      url: '/station/2042/downstream'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('River Avon level downstream at Lilbourne - GOV.UK')
    Code.expect(response.payload).to.contain('<a href="/station/2042" class="defra-river-nav-link">Upstream</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=river-avon-warwickshire" class="defra-river-nav-link">River Avon</a>')
  })
  lab.test('GET station/5146 with High river level ', async () => {
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
        value: '9.567',
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
        _: 9.354,
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
    Code.expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    Code.expect(response.payload).to.contain('defra-flood-statistics__impact defra-flood-statistics__impact--high')
    Code.expect(response.payload).to.contain('High')
    Code.expect(response.payload).to.contain('above 3.50m <span class="govuk-visually-hidden">level here</span>\n')
    Code.expect(response.payload).to.contain('<time datetime="">1:30am</time>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=river-ribble" class="defra-river-nav-link">River Ribble</a>')
  })
  lab.test('GET Closed station  ', async () => {
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

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
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
    Code.expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    Code.expect(response.payload).to.contain('No data is available. You can <a href="/river-and-sea-levels">check another river or sea level</a>.\n')
    Code.expect(response.payload).to.contain('This measuring station is closed\n')
  })
  lab.test('GET station/5146 with Low Level ', async () => {
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
        value: '9.567',
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
        _: 0.054,
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
    Code.expect(response.payload).to.contain('River Ribble level at Walton-Le-Dale - GOV.UK')
    Code.expect(response.payload).to.contain('defra-flood-statistics__impact defra-flood-statistics__impact')
    Code.expect(response.payload).to.contain('Low\n')
    Code.expect(response.payload).to.contain('below 3.50m <span class="govuk-visually-hidden">level here</span>\n')
    Code.expect(response.payload).to.contain('<time datetime="">1:30am</time>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=river-ribble" class="defra-river-nav-link">River Ribble</a>')
  })
  lab.test('GET station/3130 Coastal ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 3130,
        station_type: 'C',
        qualifier: 'u',
        telemetry_context_id: '1161422',
        telemetry_id: '49150',
        wiski_id: 'S27571_FW',
        post_process: false,
        subtract: null,
        region: 'South West',
        area: 'Devon and Cornwall',
        catchment: 'North Cornwall',
        display_region: 'South West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Bude',
        external_name: 'Bude',
        location_info: 'Bude',
        x_coord_actual: 219905,
        y_coord_actual: 106836,
        actual_ngr: '',
        x_coord_display: 219905,
        y_coord_display: 106836,
        site_max: '5',
        wiski_river_name: 'North Cornwall Coast',
        date_open: '1998-04-30T23:00:00.000Z',
        stage_datum: '0',
        period_of_record: 'to date',
        por_max_value: '5.137',
        date_por_max: '2014-01-03T06:30:00.000Z',
        highest_level: null,
        date_highest_level: null,
        por_min_value: null,
        date_por_min: null,
        percentile_5: null,
        percentile_95: null,
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-4.55886096239952,50.8329662083875]}',
        geography: '0101000020E61000006D11520C463C12C049D9FFA29E6A4940',
        centroid: '0101000020E61000006D11520C463C12C049D9FFA29E6A4940'
      }
    }

    const fakeRiverData = () => {
      return {
        river_id: 'Sea Levels',
        river_name: 'Sea Levels',
        navigable: false,
        view_rank: 1,
        rank: null,
        rloi_id: 3130,
        up: null,
        down: null,
        telemetry_id: '49150',
        region: 'South West',
        catchment: 'North Cornwall',
        wiski_river_name: 'North Cornwall Coast',
        agency_name: 'Bude',
        external_name: 'Bude',
        station_type: 'C',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '3.589',
        value_timestamp: '2020-03-23T06:00:00.000Z',
        value_erred: false,
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E61000006D11520C463C12C049D9FFA29E6A4940',
        lon: -4.55886096239952,
        lat: 50.8329662083875
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-23T06:00Z',
        _: 3.589,
        err: false,
        formattedTime: '6:00am',
        dateWhen: 'today'
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
      url: '/station/3130'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('Sea level at Bude - GOV.UK')
    Code.expect(response.payload).not.to.contain('defra-flood-statistics__impact defra-flood-statistics__impact')
    Code.expect(response.payload).to.contain('at <time datetime="">6:00am</time> today')
    Code.expect(response.payload).to.contain('3.59m')
  })
})
