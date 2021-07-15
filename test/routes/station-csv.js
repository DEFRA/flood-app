'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - station-csv', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })

    const stationCsvPlugin = {
      plugin: {
        name: 'station-csv',
        register: (server, options) => {
          server.route(require('../../server/routes/station-csv'))
        }
      }
    }

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(stationCsvPlugin)
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
    const regex = /.\/server\/models\/./
    Object.keys(require.cache).forEach((key) => {
      if (key.match(regex)) {
        delete require.cache[key]
      }
    })
  })
  lab.test('GET /station-csv FFOI station', async () => {
    const options = {
      method: 'GET',
      url: '/station-csv/5146'
    }
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

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeThresholdsData = () => [
      {
        ffoi_station_threshold_id: 133,
        ffoi_station_id: 19,
        fwis_code: '031WAF213',
        value: 2,
        fwa_name: 'River Leadon Catchment',
        fwa_type: 'a',
        fwa_severity: -1
      }
    ]

    const fakeForecastData = () => {
      return {
        $: {
          stationReference: '2017',
          stationName: 'Wedderburn Bridge',
          key: 'fwfidata/ENT_7024/MIFSMITS20210706083400000.XML',
          date: '2021-07-06',
          time: '08:34:02'
        },
        SetofValues: [{
          $: [{
            parameter: 'Water Level',
            qualifier: 'Stage',
            dataType: 'Instantaneous',
            units: 'm',
            period: '15 min',
            characteristic: 'Forecast',
            startDate: '2021-07-06',
            startTime: '09:30:00',
            endDate: '2021-07-08',
            endTime: '09:45:00'
          }],
          Value: [{
            _: '0.796',
            $: {
              date: '2021-07-06',
              time: '09:30:00',
              flag1: '1'
            }
          }, {
            _: '0.796',
            $: {
              date: '2021-07-06',
              time: '09:45:00',
              flag1: '1'
            }
          }, {
            _: '0.796',
            $: {
              date: '2021-07-09',
              time: '09:45:00',
              flag1: '1'
            }
          }]
        }]
      }
    }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getStationForecastThresholds').callsFake(fakeThresholdsData)
    sandbox.stub(floodService, 'getStationForecastData').callsFake(fakeForecastData)

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.equal('Timestamp (UTC),Height (m),Type(observed/forecast)\n2020-03-13T01:30:00Z,1.354,observed\n2021-07-06T09:30:00Z,0.796,forecast\n2021-07-06T09:45:00Z,0.796,forecast')
    Code.expect(response.result).to.not.contain('n2021-07-09T09:45:00Z,0.796,forecast')
    Code.expect(response.headers['content-type']).to.include('text/csv')
  })
  lab.test('GET /station-csv/5146', async () => {
    const options = {
      method: 'GET',
      url: '/station-csv/5146'
    }
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

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeThresholdsData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getStationForecastThresholds').callsFake(fakeThresholdsData)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.equal('Timestamp (UTC),Height (m)\n2020-03-13T01:30:00Z,1.354')
    Code.expect(response.headers['content-type']).to.include('text/csv')
  })
  lab.test('GET /station-csv/7022/downstream downstream station', async () => {
    const options = {
      method: 'GET',
      url: '/station-csv/7022/downstream'
    }
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 7022,
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

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeThresholdsData = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getStationForecastThresholds').callsFake(fakeThresholdsData)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.equal('Timestamp (UTC),Height (m)\n2020-03-13T01:30:00Z,1.354')
    Code.expect(response.headers['content-type']).to.include('text/csv')
  })
})
