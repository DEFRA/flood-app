'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Routes test - station-csv', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/routes/station-csv.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
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
      if (regex.exec(key)) {
        delete require.cache[key]
      }
    })
  })
  lab.test('GET /station-csv FFOI station', async () => {
    const options = {
      method: 'GET',
      url: '/station-csv/8208'
    }
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return { rloi_id: 8208, station_type: 'S', qualifier: 'u', telemetry_context_id: '55296792', telemetry_id: 'L2406', wiski_id: 'L2406', post_process: false, subtract: null, region: 'North East', area: 'Yorkshire', catchment: 'Swale, Ure, Nidd and Upper Ouse', display_region: 'North East', display_area: '', display_catchment: '', agency_name: 'Viking Recorder (York)', external_name: 'Viking Recorder', location_info: 'York', x_coord_actual: 460100, y_coord_actual: 451800, actual_ngr: '', x_coord_display: 460100, y_coord_display: 451800, site_max: '6', wiski_river_name: 'River Ouse', date_open: '1996-03-31T00:00:00.000Z', stage_datum: '5', period_of_record: 'to date', por_max_value: '5.4', date_por_max: '2000-11-04T01:15:00.000Z', highest_level: '5.072', date_highest_level: '2012-09-27T08:15:00.000Z', por_min_value: '-0.082', date_por_min: '1997-06-02T03:15:00.000Z', percentile_5: '1.9', percentile_95: '0.045', comments: 'ACT CON FAL', status: 'Active', status_reason: '', status_date: null, coordinates: '{"type":"Point","coordinates":[-1.0855435235656,53.9588052298611]}', geography: '0101000020E6100000F194C1E2625EF1BF63BE3821BAFA4A40', centroid: '0101000020E6100000F194C1E2625EF1BF63BE3821BAFA4A40' }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2021-07-15T12:00:00Z',
        _: 0.247,
        err: false
      }
    ]

    const fakeForecastFlag = () => data.forecastFlag

    const fakeForecastData = () => data.csvForecastData

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)
    sandbox.stub(floodService, 'getStationForecastData').callsFake(fakeForecastData)

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.equal('Timestamp (UTC),Height (m),Type(observed/forecast)\n2021-07-15T12:00:00Z,0.25,observed\n2021-07-15T12:15:00Z,0.24,forecast\n2021-07-15T12:30:00Z,0.23,forecast\n2021-07-15T12:45:00Z,0.23,forecast\n2021-07-15T13:00:00Z,0.23,forecast\n2021-07-15T13:15:00Z,0.23,forecast\n2021-07-15T13:30:00Z,0.23,forecast\n2021-07-15T13:45:00Z,0.23,forecast\n2021-07-15T14:00:00Z,0.23,forecast\n2021-07-15T14:15:00Z,0.23,forecast\n2021-07-15T14:30:00Z,0.23,forecast\n2021-07-15T14:45:00Z,0.23,forecast\n2021-07-15T15:00:00Z,0.23,forecast\n2021-07-15T15:15:00Z,0.23,forecast\n2021-07-15T15:30:00Z,0.23,forecast\n2021-07-15T15:45:00Z,0.23,forecast\n2021-07-15T16:00:00Z,0.23,forecast\n2021-07-15T16:15:00Z,0.23,forecast\n2021-07-15T16:30:00Z,0.23,forecast\n2021-07-15T16:45:00Z,0.23,forecast\n2021-07-15T17:00:00Z,0.23,forecast\n2021-07-15T17:15:00Z,0.23,forecast\n2021-07-15T17:30:00Z,0.23,forecast\n2021-07-15T17:45:00Z,0.22,forecast\n2021-07-15T18:00:00Z,0.22,forecast\n2021-07-15T18:15:00Z,0.22,forecast\n2021-07-15T18:30:00Z,0.22,forecast\n2021-07-15T18:45:00Z,0.22,forecast\n2021-07-15T19:00:00Z,0.22,forecast\n2021-07-15T19:15:00Z,0.22,forecast\n2021-07-15T19:30:00Z,0.22,forecast\n2021-07-15T19:45:00Z,0.22,forecast\n2021-07-15T20:00:00Z,0.22,forecast\n2021-07-15T20:15:00Z,0.22,forecast\n2021-07-15T20:30:00Z,0.22,forecast\n2021-07-15T20:45:00Z,0.22,forecast\n2021-07-15T21:00:00Z,0.22,forecast\n2021-07-15T21:15:00Z,0.22,forecast\n2021-07-15T21:30:00Z,0.22,forecast\n2021-07-15T21:45:00Z,0.22,forecast\n2021-07-15T22:00:00Z,0.22,forecast\n2021-07-15T22:15:00Z,0.22,forecast\n2021-07-15T22:30:00Z,0.22,forecast\n2021-07-15T22:45:00Z,0.22,forecast\n2021-07-15T23:00:00Z,0.22,forecast\n2021-07-15T23:15:00Z,0.22,forecast\n2021-07-15T23:30:00Z,0.22,forecast\n2021-07-15T23:45:00Z,0.22,forecast\n2021-07-16T00:00:00Z,0.22,forecast\n2021-07-16T00:15:00Z,0.22,forecast\n2021-07-16T00:30:00Z,0.22,forecast\n2021-07-16T00:45:00Z,0.22,forecast\n2021-07-16T01:00:00Z,0.22,forecast\n2021-07-16T01:15:00Z,0.22,forecast\n2021-07-16T01:30:00Z,0.22,forecast\n2021-07-16T01:45:00Z,0.22,forecast\n2021-07-16T02:00:00Z,0.22,forecast\n2021-07-16T02:15:00Z,0.22,forecast\n2021-07-16T02:30:00Z,0.22,forecast\n2021-07-16T02:45:00Z,0.23,forecast\n2021-07-16T03:00:00Z,0.23,forecast\n2021-07-16T03:15:00Z,0.23,forecast\n2021-07-16T03:30:00Z,0.23,forecast\n2021-07-16T03:45:00Z,0.23,forecast\n2021-07-16T04:00:00Z,0.23,forecast\n2021-07-16T04:15:00Z,0.23,forecast\n2021-07-16T04:30:00Z,0.23,forecast\n2021-07-16T04:45:00Z,0.23,forecast\n2021-07-16T05:00:00Z,0.23,forecast\n2021-07-16T05:15:00Z,0.23,forecast\n2021-07-16T05:30:00Z,0.23,forecast\n2021-07-16T05:45:00Z,0.23,forecast\n2021-07-16T06:00:00Z,0.23,forecast\n2021-07-16T06:15:00Z,0.23,forecast\n2021-07-16T06:30:00Z,0.23,forecast\n2021-07-16T06:45:00Z,0.23,forecast\n2021-07-16T07:00:00Z,0.23,forecast\n2021-07-16T07:15:00Z,0.23,forecast\n2021-07-16T07:30:00Z,0.23,forecast\n2021-07-16T07:45:00Z,0.23,forecast\n2021-07-16T08:00:00Z,0.23,forecast\n2021-07-16T08:15:00Z,0.23,forecast\n2021-07-16T08:30:00Z,0.23,forecast\n2021-07-16T08:45:00Z,0.23,forecast\n2021-07-16T09:00:00Z,0.23,forecast\n2021-07-16T09:15:00Z,0.23,forecast\n2021-07-16T09:30:00Z,0.23,forecast\n2021-07-16T09:45:00Z,0.23,forecast\n2021-07-16T10:00:00Z,0.23,forecast\n2021-07-16T10:15:00Z,0.23,forecast\n2021-07-16T10:30:00Z,0.23,forecast\n2021-07-16T10:45:00Z,0.23,forecast\n2021-07-16T11:00:00Z,0.23,forecast\n2021-07-16T11:15:00Z,0.23,forecast\n2021-07-16T11:30:00Z,0.23,forecast\n2021-07-16T11:45:00Z,0.23,forecast\n2021-07-16T12:00:00Z,0.23,forecast\n2021-07-16T12:15:00Z,0.23,forecast\n2021-07-16T12:30:00Z,0.23,forecast\n2021-07-16T12:45:00Z,0.23,forecast\n2021-07-16T13:00:00Z,0.23,forecast\n2021-07-16T13:15:00Z,0.23,forecast\n2021-07-16T13:30:00Z,0.23,forecast\n2021-07-16T13:45:00Z,0.23,forecast\n2021-07-16T14:00:00Z,0.23,forecast\n2021-07-16T14:15:00Z,0.22,forecast\n2021-07-16T14:30:00Z,0.22,forecast\n2021-07-16T14:45:00Z,0.22,forecast\n2021-07-16T15:00:00Z,0.22,forecast\n2021-07-16T15:15:00Z,0.22,forecast\n2021-07-16T15:30:00Z,0.22,forecast\n2021-07-16T15:45:00Z,0.22,forecast\n2021-07-16T16:00:00Z,0.22,forecast\n2021-07-16T16:15:00Z,0.22,forecast\n2021-07-16T16:30:00Z,0.22,forecast\n2021-07-16T16:45:00Z,0.22,forecast\n2021-07-16T17:00:00Z,0.22,forecast\n2021-07-16T17:15:00Z,0.22,forecast\n2021-07-16T17:30:00Z,0.22,forecast\n2021-07-16T17:45:00Z,0.22,forecast\n2021-07-16T18:00:00Z,0.22,forecast\n2021-07-16T18:15:00Z,0.22,forecast\n2021-07-16T18:30:00Z,0.22,forecast\n2021-07-16T18:45:00Z,0.22,forecast\n2021-07-16T19:00:00Z,0.22,forecast\n2021-07-16T19:15:00Z,0.22,forecast\n2021-07-16T19:30:00Z,0.22,forecast\n2021-07-16T19:45:00Z,0.22,forecast\n2021-07-16T20:00:00Z,0.22,forecast\n2021-07-16T20:15:00Z,0.22,forecast\n2021-07-16T20:30:00Z,0.22,forecast\n2021-07-16T20:45:00Z,0.22,forecast\n2021-07-16T21:00:00Z,0.22,forecast\n2021-07-16T21:15:00Z,0.22,forecast\n2021-07-16T21:30:00Z,0.21,forecast\n2021-07-16T21:45:00Z,0.21,forecast\n2021-07-16T22:00:00Z,0.21,forecast\n2021-07-16T22:15:00Z,0.21,forecast\n2021-07-16T22:30:00Z,0.21,forecast\n2021-07-16T22:45:00Z,0.21,forecast\n2021-07-16T23:00:00Z,0.21,forecast\n2021-07-16T23:15:00Z,0.21,forecast\n2021-07-16T23:30:00Z,0.21,forecast\n2021-07-16T23:45:00Z,0.21,forecast\n2021-07-17T00:00:00Z,1.00,forecast')
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

    const fakeForecastFlag = () => { return { } }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.equal('Timestamp (UTC),Height (m)\n2020-03-13T01:30:00Z,1.35')
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

    const fakeForecastFlag = () => { return { } }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.equal('Timestamp (UTC),Height (m)\n2020-03-13T01:30:00Z,1.35')
    Code.expect(response.headers['content-type']).to.include('text/csv')
  })
  lab.test('GET /station-csv/5110 external name has special character that needs substituting', async () => {
    const options = {
      method: 'GET',
      url: '/station-csv/5110'
    }
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {
        rloi_id: 5110,
        station_type: 'S',
        qualifier: 'u',
        telemetry_context_id: '55655529',
        telemetry_id: '725139',
        wiski_id: '725139',
        post_process: false,
        subtract: null,
        region: 'North West',
        area: 'Cumbria and Lancashire',
        catchment: 'Lune and Wyre',
        display_region: 'North West',
        display_area: '',
        display_catchment: '',
        agency_name: 'Pilling (Broadfleet Br)',
        external_name: 'Pilling, Broadfleet',
        location_info: 'Pilling',
        x_coord_actual: 340646,
        y_coord_actual: 448819,
        actual_ngr: '',
        x_coord_display: 340646,
        y_coord_display: 448819,
        site_max: '3',
        wiski_river_name: 'Broad Fleet',
        date_open: '1991-01-01T00:00:00.000Z',
        stage_datum: '2.93',
        period_of_record: 'to date',
        por_max_value: '2.509',
        date_por_max: '2019-09-30T02:30:00.000Z',
        highest_level: '2.157',
        date_highest_level: '2012-09-28T13:30:00.000Z',
        por_min_value: '0.04',
        date_por_min: '2007-02-08T13:15:00.000Z',
        percentile_5: '2.754',
        percentile_95: '0.244',
        comments: '',
        status: 'Active',
        status_reason: '',
        status_date: null,
        coordinates: '{"type":"Point","coordinates":[-2.905483527,53.932075754]}',
        geography: '0101000020E61000004666B5256E3E07C0473720424EF74A40',
        centroid: '0101000020E61000004666B5256E3E07C0473720424EF74A40'
      }
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeForecastFlag = () => { return { } }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)

    const response = await server.inject(options)
    Code.expect(response.headers['content-disposition']).to.equal('attachment; filename=Pilling-Broadfleet-height-data.csv')
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.equal('Timestamp (UTC),Height (m)\n2020-03-13T01:30:00Z,1.35')
    Code.expect(response.headers['content-type']).to.include('text/csv')
  })

  lab.test('GET /station-csv/10 station invalid', async () => {
    const options = {
      method: 'GET',
      url: '/station-csv/10'
    }
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {
      return {}
    }

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeForecastFlag = () => { return { } }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(400)
    Code.expect(response.result.statusCode).to.equal(400)
    Code.expect(response.result.error).to.equal('Bad Request')
    Code.expect(response.result.message).to.equal('Invalid request params input')
  })

  lab.test('GET /station-csv/500000 station invalid', async () => {
    const options = {
      method: 'GET',
      url: '/station-csv/500000'
    }
    const floodService = require('../../server/services/flood')

    const fakeStationData = () => {}

    const fakeTelemetryData = () => [
      {
        ts: '2020-03-13T01:30Z',
        _: 1.354,
        err: false
      }
    ]

    const fakeForecastFlag = () => { return { } }

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationData)
    sandbox.stub(floodService, 'getStationTelemetry').callsFake(fakeTelemetryData)
    sandbox.stub(floodService, 'getForecastFlag').callsFake(fakeForecastFlag)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(400)
    Code.expect(response.result.statusCode).to.equal(400)
    Code.expect(response.result.error).to.equal('Bad Request')
    Code.expect(response.result.message).to.equal('Invalid request params input')
  })
})
