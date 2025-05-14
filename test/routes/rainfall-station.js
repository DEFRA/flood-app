'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const moment = require('moment-timezone')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

describe('Route - Rainfall Station', () => {
  let sandbox
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/rainfall-station.js')]

    sandbox = await sinon.createSandbox()

    server = Hapi.server({
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
  })

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  it('should 200 with valid data', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: '2022-02-08T09:15:00.000Z'
      },
      {
        period: '15 min',
        value: '0.32',
        value_timestamp: '2022-02-08T09:00:00.000Z'
      },
      {
        period: '15 min',
        value: '0.27',
        value_timestamp: '2022-02-08T08:45:00.000Z'
      },
      {
        period: '15 min',
        value: '0.55',
        value_timestamp: '2022-02-08T08:30:00.000Z'
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    expect(response.payload).to.contain('15.0mm')
    expect(response.payload).to.contain('55.0mm')
    expect(response.payload).to.contain('65.3mm')
    expect(response.payload).to.contain('Lavenham')
    expect(response.statusCode).to.equal(200)
  })

  it('should 404', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(40, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => {}

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server, options) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(404)
  })

  it('should return a problem with measurements error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(3, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">There\'s a problem with the latest measurement</h2>')
  })

  it('should return an offline error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(15, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">This measuring station is offline</h2>')
  })

  it('should return a closed error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationTelemetryData = () => [
      {
        period: '15 min',
        value: '0',
        value_timestamp: moment().subtract(40, 'days').format()
      }
    ]

    const fakeRainfallStationData = () => ({
      telemetry_station_id: '950',
      station_reference: 'E24195',
      region: 'Anglian',
      station_name: 'LAVENHAM',
      centroid: '0101000020E610000010159197A4D6E93FB7D290B8370Q3T30',
      data_type: 'Total',
      period: '15 min',
      units: 'mm',
      telemetry_value_parent_id: '96504866',
      value: '0',
      value_timestamp: '2022-02-08T09:15:00.000Z',
      day_total: '15.00',
      six_hr_total: '55.00',
      one_hr_total: '65.27',
      type: 'R'
    })

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationTelemetryData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeRainfallStationData)

    const rainfallPlugin = {
      plugin: {
        name: 'rainfall-station',
        register: (server) => {
          server.route(require('../../server/routes/rainfall-station'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(rainfallPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">This measuring station is closed</h2>')
  })
})
