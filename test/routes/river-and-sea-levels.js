'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')
const { parse } = require('node-html-parser')

lab.experiment('Test - /river-and-sea-levels', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/routes/river-and-sea-levels.js')]
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
  lab.test('GET /river-and-sea-levels TYPO or non location "afdv vdaf adfv  fda" ', async () => {
    const floodService = require('../../server/services/flood')
    const fakeGetJson = () => data.nonLocationGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)
    const fakeRiversData = () => []

    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=wefwe%20we%20fwef%20str'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No results for \'wefwe we fwef str\'')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-see-levels with query parameters of Kinghorn, Scotland', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: false }
    }

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)

    const fakeGetJson = () => data.scotlandGetJson

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const fakeRiversData = () => []

    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Kinghorn'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<p class="govuk-body">If you searched a place outside England, you should visit:</p>\n')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /rivers-and-sea-levels Bing returns error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => []

    sandbox.stub(floodService, 'getStations').callsFake(fakeStationsData)

    const fakeRiversData = () => []

    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No results for \'WA4 1HT\'')
    Code.expect(response.payload).to.contain('<p><strong>Call Floodline for advice</strong></p>\n')
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<span class="defra-flood-levels-table-state defra-flood-levels-table-state--grey">LOW</span>')
    Code.expect(response.payload).to.contain('<span class="defra-flood-levels-table-state defra-flood-levels-table-state--grey">NORMAL</span>')
    Code.expect(response.payload).to.contain('<span class="defra-flood-levels-table-state defra-flood-levels-table-state--blue">HIGH</span>')
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Data not available')
    Code.expect(response.payload).to.contain('<span class="defra-flood-levels-table-na">n/a</a>')
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Data not available')
    Code.expect(response.payload).to.contain('<span class="defra-flood-levels-table-na">n/a</a>')
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Data not available')
    Code.expect(response.payload).to.contain('<span class="defra-flood-levels-table-na">n/a</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels stations returned but location in Wales should not show stations', async () => {
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

    const fakeRiversData = () => []

    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

    const fakeGetJson = () => data.welshLocationGetJson

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=welshpool'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<p class="govuk-body">If you searched a river or place in England, you should:</p>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels Station is coastal with percentiles so should be in river section', async () => {
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=river" data-group-type="river">River (1)</a>')
    Code.expect(response.payload).to.contain('<a href="/station/5149">')
    Code.expect(response.payload).to.contain('River Mersey at')
  })
  lab.test('GET /river-and-sea-levels Station is coastal with percentiles so should be in river section', async () => {
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=river" data-group-type="river">River (1)</a>')
    Code.expect(response.payload).to.contain('<a href="/station/5149">')
    Code.expect(response.payload).to.contain('River Mersey at')
  })
  lab.test('GET /river-and-sea-levels Station is coastal with no percentiles so should be in sea level section', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'Sea Levels',
        river_name: 'Sea Levels',
        navigable: false,
        view_rank: 2,
        rank: null,
        rloi_id: 9206,
        up: null,
        down: null,
        telemetry_id: 'E11360',
        region: 'Southern',
        catchment: 'East Hampshire',
        wiski_river_name: 'Tide',
        agency_name: 'LANGSTONE HARBOUR TL',
        external_name: 'Langstone',
        station_type: 'C',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '-8.638',
        value_timestamp: '2022-07-04T04:30:00.000Z',
        value_erred: false,
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E610000084189119A267F0BF4B5A5C49EC654940',
        lon: -1.0253010748579365,
        lat: 50.79627339372072,
        day_total: null,
        six_hr_total: null,
        one_hr_total: null,
        id: '2436'
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=river" data-group-type="river">River (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=sea" data-group-type="sea">Sea (1)</a>')
  })
  lab.test('GET /river-and-sea-levels England query', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStations').callsFake(fakeStationsData)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=England'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No results for \'England\'')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?rloi-id=7224', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => data.stationsWithinRadius

    const originalStation = () => data.riverStation7224
    const cachedStation = () => data.cachedStation

    sandbox.stub(floodService, 'getStationsByRadius').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getStationById').callsFake(originalStation)
    sandbox.stub(floodService, 'getStationsGeoJson').callsFake(cachedStation)

    // Set cached stationsGeojson

    floodService.stationsGeojson = await floodService.getStationsGeoJson()

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?rloi-id=7224'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('River (9)')
    Code.expect(response.payload).to.contain('Grants Bridge')
    Code.expect(response.payload).to.contain('Showing levels within 5 miles of Grants Bridge.')
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('GET /river-and-sea-levels only groundwater stations', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'Groundwater Levels',
        river_name: 'Groundwater Levels',
        navigable: false,
        view_rank: 2,
        rank: null,
        rloi_id: 9306,
        up: null,
        down: null,
        telemetry_id: 'TQ35_42',
        region: 'Thames',
        catchment: 'London',
        wiski_river_name: 'Groundwater Level',
        agency_name: 'Woldingham Road',
        external_name: 'Woldingham Road',
        station_type: 'G',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '77.15',
        value_timestamp: '2020-10-02T06:00:00.000Z',
        value_erred: false,
        percentile_5: '104.628',
        percentile_95: '70.609',
        centroid: '0101000020E6100000D5C8218D26B6AFBF8266C677D7A54940',
        lon: -0.061936573722862,
        lat: 51.2956380575897
      }]

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=river" data-group-type="river">River (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=sea" data-group-type="sea">Sea (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=rainfall" data-group-type="rainfall">Rainfall (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=groundwater" data-group-type="groundwater">Groundwater (1)</a>')
  })
  lab.test('GET /river-and-sea-levels only rainfall stations', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        river_id: 'rainfall-Thames',
        river_name: 'Rainfall Thames',
        navigable: false,
        view_rank: 5,
        rank: null,
        rloi_id: null,
        up: null,
        down: null,
        telemetry_id: '253861TP',
        region: 'Thames',
        catchment: null,
        wiski_river_name: null,
        agency_name: 'Worsham',
        external_name: 'Worsham',
        station_type: 'R',
        status: 'Active',
        qualifier: null,
        iswales: false,
        value: 0,
        value_timestamp: '2021-05-28T10:00:00.000Z',
        value_erred: false,
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E610000029082C882404F9BF743F936BA6E54940',
        lon: -1.56351140205562,
        lat: 51.7941412419304,
        day_total: 0,
        six_hr_total: 0,
        one_hr_total: 0
      },
      {
        river_id: 'rainfall-Thames',
        river_name: 'Rainfall Thames',
        navigable: false,
        view_rank: 5,
        rank: null,
        rloi_id: null,
        up: null,
        down: null,
        telemetry_id: '265415TP',
        region: 'Thames',
        catchment: null,
        wiski_river_name: null,
        agency_name: 'Yattendon',
        external_name: 'Yattendon',
        station_type: 'R',
        status: 'Active',
        qualifier: null,
        iswales: false,
        value: 0,
        value_timestamp: '2021-05-28T10:30:00.000Z',
        value_erred: false,
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E6100000ABC88FF60226F3BFDBF36C518BBB4940',
        lon: -1.19678016961238,
        lat: 51.4651891500468,
        day_total: 0,
        six_hr_total: 0,
        one_hr_total: 0
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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=river" data-group-type="river">River (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=sea" data-group-type="sea">Sea (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=Warrington&group=rainfall" data-group-type="rainfall">Rainfall (2)</a>')
  })
  lab.test('GET /river-and-sea-levels Test funny latest value', async () => {
    // This test is off https://eaflood.atlassian.net/browse/FSR-354
    // stations values were being compared to percentile5 with out being cast to
    // a number and the string comparison is giving incorrect results
    // if the 2 numbers were of a different factor of 10
    // ie in this example '8.9' < '10.1' returns false
    // fix use parseFloat on each value to ensure it returns true.
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
        value: '8.9',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '10.1',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ]

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStations').callsFake(fakeStationsData)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels'
    }

    const response = await server.inject(options)
    // Code.expect(response.payload).to.contain('<li class="defra-flood-list-item defra-flood-list-item--S" data-river-id="sankey-brook" data-type="S">')
    // Code.expect(response.payload).to.contain('Normal</span>')
    // Code.expect(response.payload).to.not.contain('High</span>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?rainfall-id=E24195', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => data.stationsWithinRadiusRainfallid

    const cachedStation = () => data.cachedRainfallStation

    sandbox.stub(floodService, 'getStationsByRadius').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(cachedStation)

    sandbox.stub(floodService, 'getStationsGeoJson').callsFake(cachedStation)

    // Set cached stationsGeojson

    floodService.stationsGeojson = await floodService.getStationsGeoJson()

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?rainfall-id=E24195'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?rainfall-id=GKHLETOY%%', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => data.stationsWithinRadius

    const originalStation = () => data.rainfallStation.filter(function (rainfallStation) {
      return rainfallStation.station_reference === 'GKHLETOY%%'
    })

    const cachedStation = () => data.cachedRainfallStation

    sandbox.stub(floodService, 'getStationsByRadius').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getRainfallStation').callsFake(originalStation)
    sandbox.stub(floodService, 'getStationsGeoJson').callsFake(cachedStation)

    // Set cached stationsGeojson

    floodService.stationsGeojson = await floodService.getStationsGeoJson()

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?rainfall-id=GKHLETOY%%'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(500)
  })
  lab.test('GET /river-and-sea-levels?target-area=011FWFNC6KC', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => data.stationsWithinTa

    const fakeTargetAreaData = () => data.getTA

    sandbox.stub(floodService, 'getStationsWithinTargetArea').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getTargetArea').callsFake(fakeTargetAreaData)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?target-area=011FWFNC6KC'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('River (8)')
    Code.expect(response.payload).to.contain('Showing levels within 5 miles of Keswick Campsite.')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?q=tyne returns river list', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationsData = () => []
    const fakeIsEngland = () => {
      return { is_england: true }
    }
    const fakeRiversData = () => [{ local_name: 'River North Tyne', qualified_name: 'River North Tyne', other_names: null, river_id: 'river-north-tyne' }, { local_name: 'River South Tyne', qualified_name: 'River South Tyne', other_names: null, river_id: 'river-south-tyne' }, { local_name: 'River Tyne', qualified_name: 'River Tyne', other_names: null, river_id: 'river-tyne' }]

    sandbox.stub(floodService, 'getStations').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)

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
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=tyne'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Tyne')
    Code.expect(response.payload).to.contain('<mark>Tyne</mark>')
    Code.expect(response.payload).to.contain('Rivers')
    Code.expect(response.payload).to.contain('More than one match was found for your location.')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?q=avon returns multiple choice page', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationsData = () => [{
      river_id: 'river-alne',
      river_name: 'River Alne',
      navigable: true,
      view_rank: 1,
      rank: '1',
      rloi_id: 2083,
      up: null,
      down: 2048,
      telemetry_id: '2621',
      region: 'Midlands',
      catchment: 'Warwickshire Avon',
      wiski_river_name: 'River Alne',
      agency_name: 'Henley River',
      external_name: 'Henley River',
      station_type: 'S',
      status: 'Active',
      qualifier: 'u',
      iswales: false,
      value: '0.414',
      value_timestamp: '2022-09-26T13:30:00.000Z',
      value_erred: false,
      percentile_5: '0.546',
      percentile_95: '0.387',
      centroid: '0101000020E6100000068A4FA62670FCBF9C9AE66602264A40',
      lon: -1.77738060917966,
      lat: 52.29694830188711,
      day_total: null,
      six_hr_total: null,
      one_hr_total: null,
      id: '610'
    }]
    const fakeIsEngland = () => {
      return { is_england: true }
    }
    const fakeRiversData = () => [
      {
        local_name: 'Little Avon River',
        qualified_name: 'Little Avon River',
        other_names: null,
        river_id: 'little-avon-river'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Bristol)',
        other_names: null,
        river_id: 'river-avon-bristol'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Corsham)',
        other_names: null,
        river_id: 'river-avon-corsham'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Devon)',
        other_names: null,
        river_id: 'river-avon-devon'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Hampshire)',
        other_names: null,
        river_id: 'river-avon-hampshire'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Warwickshire)',
        other_names: null,
        river_id: 'river-avon-warwickshire'
      },
      {
        local_name: 'Sherston Avon',
        qualified_name: 'Sherston Avon',
        other_names: null,
        river_id: 'sherston-avon'
      },
      {
        local_name: 'Tetbury Avon',
        qualified_name: 'Tetbury Avon',
        other_names: null,
        river_id: 'tetbury-avon'
      }
    ]

    const fakeGetJson = () => data.avonGetJson

    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=avon'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Levels near')
    Code.expect(response.payload).to.contain('Rivers')
    Code.expect(response.payload).to.contain('More than one match was found for your location.')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?q=avon&includeTypes=place returns only the place', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationsData = () => [{
      river_id: 'river-alne',
      river_name: 'River Alne',
      navigable: true,
      view_rank: 1,
      rank: '1',
      rloi_id: 2083,
      up: null,
      down: 2048,
      telemetry_id: '2621',
      region: 'Midlands',
      catchment: 'Warwickshire Avon',
      wiski_river_name: 'River Alne',
      agency_name: 'Henley River',
      external_name: 'Henley River',
      station_type: 'S',
      status: 'Active',
      qualifier: 'u',
      iswales: false,
      value: '0.414',
      value_timestamp: '2022-09-26T13:30:00.000Z',
      value_erred: false,
      percentile_5: '0.546',
      percentile_95: '0.387',
      centroid: '0101000020E6100000068A4FA62670FCBF9C9AE66602264A40',
      lon: -1.77738060917966,
      lat: 52.29694830188711,
      day_total: null,
      six_hr_total: null,
      one_hr_total: null,
      id: '610'
    }]
    const fakeIsEngland = () => {
      return { is_england: true }
    }
    const fakeRiversData = () => [
      {
        local_name: 'Little Avon River',
        qualified_name: 'Little Avon River',
        other_names: null,
        river_id: 'little-avon-river'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Bristol)',
        other_names: null,
        river_id: 'river-avon-bristol'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Corsham)',
        other_names: null,
        river_id: 'river-avon-corsham'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Devon)',
        other_names: null,
        river_id: 'river-avon-devon'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Hampshire)',
        other_names: null,
        river_id: 'river-avon-hampshire'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Warwickshire)',
        other_names: null,
        river_id: 'river-avon-warwickshire'
      },
      {
        local_name: 'Sherston Avon',
        qualified_name: 'Sherston Avon',
        other_names: null,
        river_id: 'sherston-avon'
      },
      {
        local_name: 'Tetbury Avon',
        qualified_name: 'Tetbury Avon',
        other_names: null,
        river_id: 'tetbury-avon'
      }
    ]

    const fakeGetJson = () => data.avonGetJson

    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=avon&includeTypes=place'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.match(/River Alne at[\s\n]+Henley River/)
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /river-and-sea-levels?q=avon&includeTypes=river returns only the rivers', async () => {
    const floodService = require('../../server/services/flood')
    const fakeStationsData = () => [{
      river_id: 'river-alne',
      river_name: 'River Alne',
      navigable: true,
      view_rank: 1,
      rank: '1',
      rloi_id: 2083,
      up: null,
      down: 2048,
      telemetry_id: '2621',
      region: 'Midlands',
      catchment: 'Warwickshire Avon',
      wiski_river_name: 'River Alne',
      agency_name: 'Henley River',
      external_name: 'Henley River',
      station_type: 'S',
      status: 'Active',
      qualifier: 'u',
      iswales: false,
      value: '0.414',
      value_timestamp: '2022-09-26T13:30:00.000Z',
      value_erred: false,
      percentile_5: '0.546',
      percentile_95: '0.387',
      centroid: '0101000020E6100000068A4FA62670FCBF9C9AE66602264A40',
      lon: -1.77738060917966,
      lat: 52.29694830188711,
      day_total: null,
      six_hr_total: null,
      one_hr_total: null,
      id: '610'
    }]
    const fakeIsEngland = () => {
      return { is_england: true }
    }
    const fakeRiversData = () => [
      {
        local_name: 'Little Avon River',
        qualified_name: 'Little Avon River',
        other_names: null,
        river_id: 'little-avon-river'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Bristol)',
        other_names: null,
        river_id: 'river-avon-bristol'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Corsham)',
        other_names: null,
        river_id: 'river-avon-corsham'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Devon)',
        other_names: null,
        river_id: 'river-avon-devon'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Hampshire)',
        other_names: null,
        river_id: 'river-avon-hampshire'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Warwickshire)',
        other_names: null,
        river_id: 'river-avon-warwickshire'
      },
      {
        local_name: 'Sherston Avon',
        qualified_name: 'Sherston Avon',
        other_names: null,
        river_id: 'sherston-avon'
      },
      {
        local_name: 'Tetbury Avon',
        qualified_name: 'Tetbury Avon',
        other_names: null,
        river_id: 'tetbury-avon'
      }
    ]

    const fakeGetJson = () => data.avonGetJson

    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getRiverByName').callsFake(fakeRiversData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)

    const riversPlugin = {
      plugin: {
        name: 'rivers',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(riversPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=avon&includeTypes=river'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)

    const root = parse(response.payload)
    const riverList = root
      .querySelectorAll('ul.govuk-list#rivers-list li a')
      .map(a => { return { text: a.textContent, href: a.attributes.href } })
    Code.expect(riverList.length, 'Number of matching rivers').to.equal(8)
    Code.expect(riverList, 'River list').to.include({ text: 'Tetbury Avon', href: '/river-and-sea-levels?riverId=tetbury-avon' })

    const placesList = root.querySelectorAll('ul.govuk-list#places-list li a')
    Code.expect(placesList.length, 'Number of matching places').to.equal(0)
  })
})
