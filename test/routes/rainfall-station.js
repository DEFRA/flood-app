'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Test - /rainfal-station', () => {
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
    // const floodService = require('../../server/services/flood')



    // const fakeStationsData = () => [
    //   {
    //     river_id: 'river-mersey',
    //     river_name: 'River Mersey',
    //     navigable: true,
    //     view_rank: 3,
    //     rank: 5,
    //     rloi_id: 5149,
    //     up: 5052,
    //     down: 5050,
    //     telemetry_id: '693976',
    //     region: 'North West',
    //     catchment: 'Lower Mersey',
    //     wiski_river_name: 'River Mersey',
    //     agency_name: 'Westy',
    //     external_name: 'Westy',
    //     station_type: 'S',
    //     status: 'Active',
    //     qualifier: 'u',
    //     iswales: false,
    //     value: '6.122',
    //     value_timestamp: '2020-02-27T14:30:00.000Z',
    //     value_erred: false,
    //     percentile_5: '4.14',
    //     percentile_95: '3.548',
    //     centroid: '0101000020E6100000DF632687A47B04C09BC5867601B24A40',
    //     lon: -2.56037240587146,
    //     lat: 53.3906696470323
    //   },
    //   {
    //     river_id: 'river-mersey',
    //     river_name: 'River Mersey',
    //     navigable: true,
    //     view_rank: 3,
    //     rank: 6,
    //     rloi_id: 5050,
    //     up: 5149,
    //     down: 5084,
    //     telemetry_id: '694063',
    //     region: 'North West',
    //     catchment: 'Lower Mersey',
    //     wiski_river_name: 'River Mersey',
    //     agency_name: 'Fiddlers Ferry',
    //     external_name: 'Fiddlers Ferry',
    //     station_type: 'S',
    //     status: 'Active',
    //     qualifier: 'u',
    //     iswales: false,
    //     value: '3.458',
    //     value_timestamp: '2020-02-27T04:30:00.000Z',
    //     value_erred: false,
    //     percentile_5: '6.2',
    //     percentile_95: '2.611',
    //     centroid: '0101000020E61000001248AD04653A05C01F4188A7E5AF4A40',
    //     lon: -2.65351298955739,
    //     lat: 53.3741959967904
    //   },
    //   {
    //     river_id: 'sankey-brook',
    //     river_name: 'Sankey Brook',
    //     navigable: true,
    //     view_rank: 3,
    //     rank: 1,
    //     rloi_id: 5031,
    //     up: null,
    //     down: 5069,
    //     telemetry_id: '694039',
    //     region: 'North West',
    //     catchment: 'Lower Mersey',
    //     wiski_river_name: 'Sankey Brook',
    //     agency_name: 'Causey Bridge',
    //     external_name: 'Causey Bridge',
    //     station_type: 'S',
    //     status: 'Active',
    //     qualifier: 'u',
    //     iswales: false,
    //     value: '0.111',
    //     value_timestamp: '2020-02-27T14:30:00.000Z',
    //     value_erred: false,
    //     percentile_5: '2.5',
    //     percentile_95: '0.209',
    //     centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
    //     lon: -2.62207742214111,
    //     lat: 53.4253300018109
    //   }
    // ]

    // sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    // sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    // const fakeGetJson = () => data.warringtonGetJson

    // const util = require('../../server/util')
    // sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

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

    console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT')

    const response = await server.inject(options)

    // Code.expect(response.payload).to.contain('Low</span>')
    // Code.expect(response.payload).to.contain('<li class="defra-flood-list-item defra-flood-list-item--S" data-river-id="sankey-brook" data-type="S">')
    // Code.expect(response.payload).to.contain('Normal</span>')
    // Code.expect(response.payload).to.contain('<li class="defra-flood-list-item defra-flood-list-item--S" data-river-id="river-mersey" data-type="S">')
    // Code.expect(response.payload).to.contain('High</span>')
    // Code.expect(response.payload).to.contain('<li class="defra-flood-list-item defra-flood-list-item--S" data-river-id="river-mersey" data-type="S">')
    // Code.expect(response.payload).to.contain('3 levels')
    // Code.expect(response.payload).to.contain('River Mersey')
    // Code.expect(response.payload).to.contain('Sankey Brook')
    Code.expect(response.statusCode).to.equal(200)
  })
})
