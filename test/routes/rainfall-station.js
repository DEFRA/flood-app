'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
// const data = require('../data')

lab.experiment('Test - /rainfall-station', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
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

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })
  lab.test('GET /rainfall-station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeRainfallStationsData = () => [
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

    const fakeStationTotalsData = () => [
      {
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
      }
    ]

    sandbox.stub(floodService, 'getRainfallStationTelemetry').callsFake(fakeRainfallStationsData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(fakeStationTotalsData)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/rainfall-station/E24195'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('15.00mm')
    Code.expect(response.payload).to.contain('55.00mm')
    Code.expect(response.payload).to.contain('65.27mm')
    Code.expect(response.payload).to.contain('Lavenham')
    Code.expect(response.statusCode).to.equal(200)
  })
})
