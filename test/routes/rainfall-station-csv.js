'use strict'

const Hapi = require('@hapi/hapi')

describe('Route - Rainfall Station CSV', () => {
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/routes/rainfall-station-csv.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]

    server = Hapi.server({
      port: 3000, host: 'localhost'
    })

    const rainfallStationCsvPlugin = {
      plugin: {
        name: 'rainfall-station-csv',
        register: (server) => {
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

  afterEach(async () => {
    await server.stop()

    const regex = /.\/server\/models\/./

    Object.keys(require.cache).forEach((key) => {
      if (key.match(regex)) {
        delete require.cache[key]
      }
    })
  })

  it('should 200 returning rainfall station', async () => {
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

    jest.spyOn(floodService, 'getRainfallStation').mockImplementation(fakeRainfallStationData)
    jest.spyOn(floodService, 'getRainfallStationTelemetry').mockImplementation(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
    expect(response.result).toContain('Timestamp (UTC),Rainfall (mm)\n2021-07-15T12:00:00Z,0.2')
    expect(response.headers['content-type']).toContain('text/csv')
  })

  it('should preserve 0.01 rainfall values in CSV output', async () => {
    const options = {
      method: 'GET', url: '/rainfall-station-csv/E24195'
    }

    const floodService = require('../../server/services/flood')

    const fakeRainfallStationData = () => ({
      telemetry_station_id: 950,
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      period: '15 min',
      units: 'mm',
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
      period: '15 min', value: 0.01, value_timestamp: '2021-07-15T12:00:00Z'
    }]

    jest.spyOn(floodService, 'getRainfallStation').mockImplementation(fakeRainfallStationData)
    jest.spyOn(floodService, 'getRainfallStationTelemetry').mockImplementation(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    expect(response.statusCode).toBe(200)
    expect(response.result).toContain('Timestamp (UTC),Rainfall (mm)\n2021-07-15T12:00:00Z,0.01')
  })

  it('should return station name not capitalised', async () => {
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

    jest.spyOn(floodService, 'getRainfallStation').mockImplementation(fakeRainfallStationData)
    jest.spyOn(floodService, 'getRainfallStationTelemetry').mockImplementation(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    expect(response.headers['content-disposition']).toContain('filename=Lavenham-rainfall-data.csv')
  })

  it('should pad telemetry results to 5 days', async () => {
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

    jest.spyOn(floodService, 'getRainfallStation').mockImplementation(fakeRainfallStationData)
    jest.spyOn(floodService, 'getRainfallStationTelemetry').mockImplementation(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    const count = (response.result.match(/\n/g) || []).length

    expect(count).toBe(480)
  })

  it('should 404 if no station', async () => {
    const options = {
      method: 'GET', url: '/rainfall-station-csv/E24195'
    }

    const floodService = require('../../server/services/flood')

    const fakeRainfallStationData = () => {}

    const fakeRainfallTelemetryData = () => [{
      period: '15 min', value: 0.2, value_timestamp: '2021-07-15T12:00:00Z'
    }]

    jest.spyOn(floodService, 'getRainfallStation').mockImplementation(fakeRainfallStationData)
    jest.spyOn(floodService, 'getRainfallStationTelemetry').mockImplementation(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    expect(response.statusCode).toBe(404)
    expect(response.result.statusCode).toBe(404)
    expect(response.result.error).toBe('Not Found')
    expect(response.result.message).toBe('Rainfall station not found')
  })

  it('should 404 if no station telemetry data', async () => {
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

    jest.spyOn(floodService, 'getRainfallStation').mockImplementation(fakeRainfallStationData)
    jest.spyOn(floodService, 'getRainfallStationTelemetry').mockImplementation(fakeRainfallTelemetryData)

    const response = await server.inject(options)

    expect(response.statusCode).toBe(404)
    expect(response.result.statusCode).toBe(404)
    expect(response.result.error).toBe('Not Found')
    expect(response.result.message).toBe('No rainfall station telemetry data found')
  })

  it('should use hourly durations when telemetry is not in 15 minute periods', async () => {
    const floodService = require('../../server/services/flood')
    const util = require('../../server/util')
    const formatSpy = jest.spyOn(util, 'formatRainfallTelemetry')

    jest.spyOn(floodService, 'getRainfallStation').mockResolvedValue({ station_name: 'LAVENHAM' })
    jest.spyOn(floodService, 'getRainfallStationTelemetry').mockResolvedValue([
      { period: '1 hr', value: 0.4, value_timestamp: '2021-07-15T12:00:00Z' }
    ])

    const response = await server.inject({ method: 'GET', url: '/rainfall-station-csv/E24195' })

    expect(response.statusCode).toBe(200)
    expect(formatSpy.mock.calls[0][1]).toBe(45)
  })
})
