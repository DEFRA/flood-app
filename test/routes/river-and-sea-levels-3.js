'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - /river-and-sea-levels', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/river-and-sea-levels.js')]
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

  lab.test('GET /river-and-sea-levels for River Granta', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => [
      {
        rloi_id: 6194,
        telemetry_id: 'E21005',
        region: 'Anglian',
        catchment: 'Cam and Ely Ouse (Including South Level)',
        wiski_river_name: 'River Granta',
        agency_name: 'Babraham',
        external_name: 'Babraham',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.116',
        value_timestamp: '2020-02-10T04:30:00.000Z',
        value_erred: false,
        percentile_5: '0.234999999999999',
        percentile_95: '0.0440000000000005'
      },
      {
        rloi_id: 6074,
        telemetry_id: 'E21724',
        region: 'Anglian',
        catchment: 'Cam and Ely Ouse (Including South Level)',
        wiski_river_name: 'River Granta',
        agency_name: 'Linton',
        external_name: 'Linton',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.178',
        value_timestamp: '2020-02-10T06:30:00.000Z',
        value_erred: false,
        percentile_5: '0.739999999999999',
        percentile_95: '0.0700000000000003'
      },
      {
        rloi_id: 6195,
        telemetry_id: 'E22041',
        region: 'Anglian',
        catchment: 'Cam and Ely Ouse (Including South Level)',
        wiski_river_name: 'River Granta',
        agency_name: 'Stapleford',
        external_name: 'Stapleford',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.156',
        value_timestamp: '2020-02-10T06:00:00.000Z',
        value_erred: false,
        percentile_5: '1.02',
        percentile_95: '0.0499999999999989'
      }
    ]

    sandbox.stub(floodService, 'getStationsByRiver').callsFake(fakeStationsData)

    floodService.stationsGeojson = {
      features: [
        {
          properties: {
            river: 'River Granta'
          }
        },
        {
          properties: {
            river: 'River Mersey'
          }
        },
        {
          properties: {
            river: 'River Severn'
          }
        },
        {
          properties: {
            river: 'River Trent'
          }
        }
      ]
    }

    Code.expect(floodService.rivers).to.equal(['River Granta', 'River Mersey', 'River Severn', 'River Trent'])

    const locationPlugin = {
      plugin: {
        name: 'river-and-sea-levels',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(locationPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=River%20Granta&type=river'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('3 levels')
    Code.expect(response.payload).to.contain('Linton')
    Code.expect(response.payload).to.contain('River Granta latest river and sea levels - GOV.UK')
  })
})
