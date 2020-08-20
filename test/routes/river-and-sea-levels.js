'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Test - /river-and-sea-levels', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
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
  lab.test('GET river-and-sea-levels TYPO or non location "afdv vdaf adfv  fda" ', async () => {
    const fakeGetJson = () => data.nonLocationGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=wefwe%20we%20fwef%20str'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No river, sea or groundwater levels found.')
    Code.expect(response.payload).to.contain('0 levels')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with query parameters of Kinghorn, Scotland', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: false }
    }

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)

    const fakeGetJson = () => data.scotlandGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Kinghorn'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<strong>This service provides flood risk information for England only.</strong>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /rivers-and-sea-levels Bing returns error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => [
      {
        rloi_id: 5203,
        telemetry_id: '694460',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Netherley Brook',
        agency_name: 'Winster Drive',
        external_name: 'Winster Drive',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.502',
        value_timestamp: '2020-02-21T04:30:00.000Z',
        value_erred: false,
        percentile_5: '2.7',
        percentile_95: '0.219'
      }
    ]

    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => {
      throw new Error('Bing error')
    }

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location - River and sea levels in England - GOV.UK')
    Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels with levels Low, Normal, High', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'river-mersey',
        river_name: 'River Mersey',
        navigable: true,
        view_rank: 3,
        rank: 5,
        rloi_id: 5149,
        up: 5052,
        down: 5050,
        telemetry_id: '693976',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Westy',
        external_name: 'Westy',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '6.122',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '4.14',
        percentile_95: '3.548',
        centroid: '0101000020E6100000DF632687A47B04C09BC5867601B24A40',
        lon: -2.56037240587146,
        lat: 53.3906696470323
      },
      {
        river_id: 'river-mersey',
        river_name: 'River Mersey',
        navigable: true,
        view_rank: 3,
        rank: 6,
        rloi_id: 5050,
        up: 5149,
        down: 5084,
        telemetry_id: '694063',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Fiddlers Ferry',
        external_name: 'Fiddlers Ferry',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '3.458',
        value_timestamp: '2020-02-27T04:30:00.000Z',
        value_erred: false,
        percentile_5: '6.2',
        percentile_95: '2.611',
        centroid: '0101000020E61000001248AD04653A05C01F4188A7E5AF4A40',
        lon: -2.65351298955739,
        lat: 53.3741959967904
      },
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.111',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('</time> (low)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--low">')
    Code.expect(response.payload).to.contain('</time> (normal)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--normal">')
    Code.expect(response.payload).to.contain('</time> (<strong>high</strong>)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--high">')
    Code.expect(response.payload).to.contain('3 levels')
    Code.expect(response.payload).to.contain('River Mersey')
    Code.expect(response.payload).to.contain('Sankey Brook')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels station status Closed', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Closed',
        qualifier: 'u',
        iswales: false,
        value: '0.111',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Data not available')
    Code.expect(response.payload).to.contain('1 level')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=sankey-brook">Sankey Brook</a>')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item">')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels station status Suspended', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Suspended',
        qualifier: 'u',
        iswales: false,
        value: '0.111',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Data not available')
    Code.expect(response.payload).to.contain('1 level')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=sankey-brook">Sankey Brook</a>')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item">')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels station status Active but no value', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: null,
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Data error')
    Code.expect(response.payload).to.contain('1 level')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=sankey-brook">Sankey Brook</a>')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--error">')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?river-id=sankey-brook ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => [
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.688',
        value_timestamp: '2020-02-28T10:00:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      },
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 2,
        rloi_id: 5069,
        up: 5031,
        down: 5085,
        telemetry_id: '694042',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Higham Avenue',
        external_name: 'Higham Avenue',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '1.073',
        value_timestamp: '2020-02-28T04:30:00.000Z',
        value_erred: false,
        percentile_5: '2.8',
        percentile_95: '0.24',
        centroid: '0101000020E610000087D469EE19DF04C0CE5E7EB11EB44A40',
        lon: -2.60893617878407,
        lat: 53.4071866862338
      },
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 3,
        rloi_id: 5085,
        up: 5069,
        down: null,
        telemetry_id: '694041',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Liverpool Road',
        external_name: 'Liverpool Road',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '2.058',
        value_timestamp: '2020-02-28T04:30:00.000Z',
        value_erred: false,
        percentile_5: '3.8',
        percentile_95: '1.209',
        centroid: '0101000020E6100000B06488BD97FE04C0ACE6D4C01FB14A40',
        lon: -2.62431285927286,
        lat: 53.3837815322453
      }
    ]

    sandbox.stub(floodService, 'getRiverById').callsFake(fakeStationsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?river-id=sankey-brook'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('3 level')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=sankey-brook">Sankey Brook</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels stations in Wales', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: false }
    }

    const fakeStationsData = () => [
      {
        river_id: 'lledan-brook',
        river_name: 'Lledan Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 2089,
        up: null,
        down: null,
        telemetry_id: '2638',
        region: 'Wales',
        catchment: 'Severn Uplands',
        wiski_river_name: 'Lledan Brook',
        agency_name: 'Welshpool',
        external_name: 'Welshpool',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: true,
        value: '0.297',
        value_timestamp: '2020-03-04T09:00:00.000Z',
        value_erred: false,
        percentile_5: '0.36',
        percentile_95: '0.065',
        centroid: '0101000020E610000011F39E34DD3E09C0EDCA71828A544A40',
        lon: -3.15569535360408,
        lat: 52.6604769759777
      },
      {
        river_id: 'river-severn',
        river_name: 'River Severn',
        navigable: true,
        view_rank: 3,
        rank: 7,
        rloi_id: 2068,
        up: 2072,
        down: 2061,
        telemetry_id: '2176',
        region: 'Wales',
        catchment: 'Severn Uplands',
        wiski_river_name: 'River Severn',
        agency_name: 'Buttington',
        external_name: 'Buttington',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: true,
        value: '3.192',
        value_timestamp: '2020-03-04T09:00:00.000Z',
        value_erred: false,
        percentile_5: '3.509',
        percentile_95: '0.756',
        centroid: '0101000020E6100000188D8E3E20ED08C0AB99B41013564A40',
        lon: -3.11578415749103,
        lat: 52.6724568254316
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => data.welshpoolGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=welshpool'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?river-id=lledan-brook">Lledan Brook</a>')
    Code.expect(response.payload).to.contain('(Natural Resources Wales)\n')
    Code.expect(response.payload).to.contain('<a href="/station/2089">\n')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels Station is coastal', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'river-mersey',
        river_name: 'River Mersey',
        navigable: true,
        view_rank: 3,
        rank: 5,
        rloi_id: 5149,
        up: 5052,
        down: 5050,
        telemetry_id: '693976',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Westy',
        external_name: 'Westy',
        station_type: 'C',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '6.122',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '4.14',
        percentile_95: '3.548',
        centroid: '0101000020E6100000DF632687A47B04C09BC5867601B24A40',
        lon: -2.56037240587146,
        lat: 53.3906696470323
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item">')
    Code.expect(response.payload).to.contain('<time datetime="2020-02-27T14:30:00.000Z">on 27/02/2020 2:30pm</time>')
  })
  lab.test('GET /river-and-sea-levels?target-area=013WAFGL ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => data.stationsAndTargetArea

    sandbox.stub(floodService, 'getStationsWithinTargetArea').callsFake(fakeStationsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?target-area=013WAFGL'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('1 level')
    Code.expect(response.payload).to.contain('Showing levels within 5 miles of River Glaze catchment including Leigh and East Wigan')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels querey returns undefined', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'river-mersey',
        river_name: 'River Mersey',
        navigable: true,
        view_rank: 3,
        rank: 5,
        rloi_id: 5149,
        up: 5052,
        down: 5050,
        telemetry_id: '693976',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Westy',
        external_name: 'Westy',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '6.122',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '4.14',
        percentile_95: '3.548',
        centroid: '0101000020E6100000DF632687A47B04C09BC5867601B24A40',
        lon: -2.56037240587146,
        lat: 53.3906696470323
      },
      {
        river_id: 'river-mersey',
        river_name: 'River Mersey',
        navigable: true,
        view_rank: 3,
        rank: 6,
        rloi_id: 5050,
        up: 5149,
        down: 5084,
        telemetry_id: '694063',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Fiddlers Ferry',
        external_name: 'Fiddlers Ferry',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '3.458',
        value_timestamp: '2020-02-27T04:30:00.000Z',
        value_erred: false,
        percentile_5: '6.2',
        percentile_95: '2.611',
        centroid: '0101000020E61000001248AD04653A05C01F4188A7E5AF4A40',
        lon: -2.65351298955739,
        lat: 53.3741959967904
      },
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.111',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => {
      return {
        authenticationResultCode: 'ValidCredentials',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright',
        resourceSets: [
          {
            estimatedTotal: 0,
            resources: []
          }
        ],
        statusCode: 200,
        tatusDescription: 'OK',
        traceId: 'trace-id'
      }
    }

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('</time> (low)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--low">')
    Code.expect(response.payload).to.contain('</time> (normal)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--normal">')
    Code.expect(response.payload).to.contain('</time> (<strong>high</strong>)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--high">')
    Code.expect(response.payload).to.contain('3 levels')
    Code.expect(response.payload).to.contain('River Mersey')
    Code.expect(response.payload).to.contain('Sankey Brook')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels querey returns undefined', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'river-mersey',
        river_name: 'River Mersey',
        navigable: true,
        view_rank: 3,
        rank: 5,
        rloi_id: 5149,
        up: 5052,
        down: 5050,
        telemetry_id: '693976',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Westy',
        external_name: 'Westy',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '6.122',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '4.14',
        percentile_95: '3.548',
        centroid: '0101000020E6100000DF632687A47B04C09BC5867601B24A40',
        lon: -2.56037240587146,
        lat: 53.3906696470323
      },
      {
        river_id: 'river-mersey',
        river_name: 'River Mersey',
        navigable: true,
        view_rank: 3,
        rank: 6,
        rloi_id: 5050,
        up: 5149,
        down: 5084,
        telemetry_id: '694063',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Fiddlers Ferry',
        external_name: 'Fiddlers Ferry',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '3.458',
        value_timestamp: '2020-02-27T04:30:00.000Z',
        value_erred: false,
        percentile_5: '6.2',
        percentile_95: '2.611',
        centroid: '0101000020E61000001248AD04653A05C01F4188A7E5AF4A40',
        lon: -2.65351298955739,
        lat: 53.3741959967904
      },
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.111',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q='
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('</time> (low)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--low">')
    Code.expect(response.payload).to.contain('</time> (normal)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--normal">')
    Code.expect(response.payload).to.contain('</time> (<strong>high</strong>)')
    Code.expect(response.payload).to.contain('<div class="defra-flood-list__item defra-flood-list__item--high">')
    Code.expect(response.payload).to.contain('3 levels')
    Code.expect(response.payload).to.contain('River Mersey')
    Code.expect(response.payload).to.contain('Sankey Brook')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET river-and-sea-levels fail joi validation" ', async () => {
    const fakeGetJson = () => data.nonLocationGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?testFail=Test'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(404)
  })
})
