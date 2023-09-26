'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - rainfall-station-csv', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/routes/rainfall-station-csv.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000, host: 'localhost'
    })

    const rainfallStationCsvPlugin = {
      plugin: {
        name: 'rainfall-station-csv',
        register: (server, options) => {
          server.route(require('../../server/routes/rainfall-station-csv'))
        }
      }
    }

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/views'))
    await server.register(rainfallStationCsvPlugin)
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
  lab.test('GET /rainfall-station-csv rainfall station', async () => {
    const options = {
      method: 'GET', url: '/rainfall-station-csv/E24195'
    }
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationData = () => ({
      telemetry_station_id: 950,
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      ngr: 'TL9237348710',
      easting: 594000,
      northing: 243000,
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: 96703927,
      value: 0,
      value_timestamp: '2022-02-09T09:15:00.000Z',
      day_total: 20.00,
      six_hr_total: 15.23,
      one_hr_total: 3.21,
      type: 'R',
      lat: 56.103262968744666,
      lon: 2.8074515304839753
    })
    const fakeRainfallTelemetryData = () => [{
      period: '15 min', value: 0.2, value_timestamp: '2021-07-15T12:00:00Z'
    }]

    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)
    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.result).to.contain('Timestamp (UTC),Rainfall (mm)\n2021-07-15T12:00:00Z,0.2')
    Code.expect(response.headers['content-type']).to.include('text/csv')
  })
  lab.test('GET /rainfall-station-csv test station name not capitalised', async () => {
    const options = {
      method: 'GET', url: '/rainfall-station-csv/E24195'
    }
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationData = () => ({
      telemetry_station_id: 950,
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      ngr: 'TL9237348710',
      easting: 594000,
      northing: 243000,
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: 96703927,
      value: 0,
      value_timestamp: '2022-02-09T09:15:00.000Z',
      day_total: 20.00,
      six_hr_total: 15.23,
      one_hr_total: 3.21,
      type: 'R',
      lat: 56.103262968744666,
      lon: 2.8074515304839753
    })
    const fakeRainfallTelemetryData = () => [{
      period: '15 min', value: 0.2, value_timestamp: '2021-07-15T12:00:00Z'
    }]

    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)
    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    Code.expect(response.headers['content-disposition']).to.include('filename=Lavenham-rainfall-data.csv')
  })
  lab.test('GET /rainfall-station-csv test telemetry results are padded to 5 days', async () => {
    const options = {
      method: 'GET', url: '/rainfall-station-csv/E24195'
    }
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationData = () => ({
      telemetry_station_id: 950,
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      ngr: 'TL9237348710',
      easting: 594000,
      northing: 243000,
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: 96703927,
      value: 0,
      value_timestamp: '2022-02-09T09:15:00.000Z',
      day_total: 20.00,
      six_hr_total: 15.23,
      one_hr_total: 3.21,
      type: 'R',
      lat: 56.103262968744666,
      lon: 2.8074515304839753
    })
    const fakeRainfallTelemetryData = () => [{
      period: '15 min', value: 0.2, value_timestamp: '2021-07-15T12:00:00Z'
    }]

    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)
    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    const count = (response.result.match(/\n/g) || []).length

    Code.expect(count).to.equal(480)
  })

  lab.test('GET /rainfall-station-csv test return 404 if no station', async () => {
    const options = {
      method: 'GET', url: '/rainfall-station-csv/E24195'
    }
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationData = () => {}
    const fakeRainfallTelemetryData = () => [{
      period: '15 min', value: 0.2, value_timestamp: '2021-07-15T12:00:00Z'
    }]

    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)
    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(404)
    Code.expect(response.result.statusCode).to.equal(404)
    Code.expect(response.result.error).to.equal('Not Found')
    Code.expect(response.result.message).to.equal('Rainfall station not found')
  })

  lab.test('GET /rainfall-station-csv test return 404 if no station', async () => {
    const options = {
      method: 'GET', url: '/rainfall-station-csv/E24195'
    }
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationData = () => ({
      telemetry_station_id: 950,
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      ngr: 'TL9237348710',
      easting: 594000,
      northing: 243000,
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: 96703927,
      value: 0,
      value_timestamp: '2022-02-09T09:15:00.000Z',
      day_total: 20.00,
      six_hr_total: 15.23,
      one_hr_total: 3.21,
      type: 'R',
      lat: 56.103262968744666,
      lon: 2.8074515304839753
    })
    const fakeRainfallTelemetryData = () => {}

    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)
    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(404)
    Code.expect(response.result.statusCode).to.equal(404)
    Code.expect(response.result.error).to.equal('Not Found')
    Code.expect(response.result.message).to.equal('No rainfall station telemetry data found')
  })
})
