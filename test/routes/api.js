'use strict'
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('API routes test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]

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

  lab.test('GET /api/stations', async () => {
    const getStationsGeojson = () => {
      return JSON.parse('{"type": "FeatureCollection", "features": []}')
    }

    const floodService = require('../../server/services/flood')
    sandbox.stub(floodService, 'getStationsGeoJson').callsFake(getStationsGeojson)

    // Fake the cached rainfall data
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const route = {
      plugin: {
        name: 'stations',
        register: (server) => {
          server.route(require('../../server/routes/api/stations.geojson'))
        }
      }
    }

    await server.register(require('../../server/plugins/session'))
    await server.register(route)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/api/stations.geojson'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('{"type":"FeatureCollection","features":[]}')
  })

  lab.test('GET /api/rainfall', async () => {
    const getRainfallGeojson = () => {
      return JSON.parse('{"type": "FeatureCollection", "features": []}')
    }

    const floodService = require('../../server/services/flood')
    sandbox.stub(floodService, 'getRainfallGeojson').callsFake(getRainfallGeojson)

    // Fake the cached rainfall data
    floodService.rainfallGeojson = await floodService.getRainfallGeojson()

    const route = {
      plugin: {
        name: 'rainfall',
        register: (server) => {
          server.route(require('../../server/routes/api/rainfall.geojson'))
        }
      }
    }

    await server.register(require('../../server/plugins/session'))
    await server.register(route)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/api/rainfall.geojson'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('{"type":"FeatureCollection","features":[]}')
  })

  lab.test('GET /api/warnings with location', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => data.fakeFloodsData

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/api/warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/api/warnings?location=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)

    const payload = JSON.parse(response.payload)
    Code.expect(payload.severity).to.equal(3)
    Code.expect(payload.message).to.equal('There are currently one severe flood warning, one flood warning and 3 flood alerts in force at this location.')
  })
  lab.test('GET /api/warnings with no location', async () => {
    const floodService = require('../../server/services/flood')
    // Create dummy flood data in place of cached data
    const fakeFloodData = () => {
      return {
        floods: [
          {
            ta_code: '013FWFCH29',
            id: 4558714,
            ta_name: 'Wider area at risk from Sankey Brook at Dallam',
            quick_dial: '305027',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity_value: 2,
            severitydescription: 'Flood Warning',
            warningkey: 1,
            message_received: '2020-01-08T13:09:09.628Z',
            severity_changed: '2020-01-08T13:09:09.628Z',
            situation_changed: '2020-01-08T13:09:09.628Z',
            situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elits nibh.'
          }
        ]
      }
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/api/warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/api/warnings'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)

    const payload = JSON.parse(response.payload)
    Code.expect(payload.severity).to.equal(2)
    Code.expect(payload.message).to.equal('There is currently one flood warning in force.')
  })
  lab.test('GET /api/warnings with bad query', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => data.fakeFloodsData

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/api/warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/api/warnings?locati=warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(400)
  })
  lab.test('GET /api/warnings with no warnings', async () => {
    const floodService = require('../../server/services/flood')
    // Create dummy flood data in place of cached data
    const fakeFloodData = () => {
      return {
        floods: []
      }
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/api/warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/api/warnings'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)

    const payload = JSON.parse(response.payload)
    Code.expect(payload.severity).to.equal(5)
    Code.expect(payload.message).to.equal('There are currently no flood warnings or alerts in force.')
  })
  lab.test('GET /api/warnings with no location one alert', async () => {
    const floodService = require('../../server/services/flood')
    // Create dummy flood data in place of cached data
    const fakeFloodData = () => {
      return {
        floods: [
          {
            ta_code: '013FWFCH29',
            id: 4558714,
            ta_name: 'Wider area at risk from Sankey Brook at Dallam',
            quick_dial: '305027',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity_value: 1,
            severitydescription: 'Flood Alert',
            warningkey: 1,
            message_received: '2020-01-08T13:09:09.628Z',
            severity_changed: '2020-01-08T13:09:09.628Z',
            situation_changed: '2020-01-08T13:09:09.628Z',
            situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elits nibh.'
          }
        ]
      }
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/api/warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/api/warnings'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)

    const payload = JSON.parse(response.payload)
    Code.expect(payload.severity).to.equal(1)
    Code.expect(payload.message).to.equal('There is currently one flood alert in force.')
  })
  lab.test('GET /api/warnings with no location one severe warning', async () => {
    const floodService = require('../../server/services/flood')
    // Create dummy flood data in place of cached data
    const fakeFloodData = () => {
      return {
        floods: [
          {
            ta_code: '013FWFCH29',
            id: 4558714,
            ta_name: 'Wider area at risk from Sankey Brook at Dallam',
            quick_dial: '305027',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity_value: 3,
            severitydescription: 'Severe Flood Warning',
            warningkey: 1,
            message_received: '2020-01-08T13:09:09.628Z',
            severity_changed: '2020-01-08T13:09:09.628Z',
            situation_changed: '2020-01-08T13:09:09.628Z',
            situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elits nibh.'
          }
        ]
      }
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/api/warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/api/warnings'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)

    const payload = JSON.parse(response.payload)
    Code.expect(payload.severity).to.equal(3)
    Code.expect(payload.message).to.equal('There is currently one severe flood warning in force.')
  })

  lab.test('GET /api/latest-levels/{target-area}', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = async () => ({
      floods: [
        {
          ta_id: 2625,
          ta_code: '111FAGSPGW',
          ta_name: 'Groundwater flooding in the Salisbury Plain area',
          ta_description: 'Boscombe, Cholderton, Collingbourne Ducis, Hanging Langford, Hindon, Hurdcott, Idmiston, Newton Tony, Orcheston, Porton, Salisbury, Shipton Bellinger, Shrewton, Stratford Sub Castle, Tidworth, Tilshead, Tisbury, Wilton, Winterbourne Stoke and Woodford',
          situation: 'TEST - Enter flood situation message here',
          quick_dial: 210022,
          situation_changed: '2025-04-15T09:30:00.000Z',
          severity_changed: '2025-04-17T09:30:00.000Z',
          message_received: '2025-04-17T11:23:11.175Z',
          severity_value: 3,
          severity: 'Severe flood warning',
          geometry: '{"type":"Point","coordinates":[-1.902707064,51.208434127]}'
        }
      ]
    })

    const fakeTAThresholdsData = async () => (
      [
        {
          rloi_id: 9162,
          river_name: 'Groundwater',
          station_threshold_id: '110348',
          agency_name: 'Clarendon OB6',
          external_name: 'Clarendon',
          station_type: 'G',
          status: 'Active',
          iswales: false,
          latest_level: '67.47',
          threshold_value: '123.00',
          direction: 'u',
          threshold_type: 'FW RES FW',
          value_timestamp: '27 minutes ago',
          post_process: false,
          stage_datum: '0',
          subtract: null,
          severity_value: 3,
          formatted_time: '27 minutes ago',
          isSuspendedOrOffline: false,
          isGroundwater: true,
          isCoastal: false
        }
      ]
    )

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const latestLevelsPlugin = {
      plugin: {
        name: 'latest-levels',
        register: (server, options) => {
          server.route(require('../../server/routes/api/latest-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(latestLevelsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/api/latest-levels/111FAGSPGW'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)

    const payload = JSON.parse(response.payload)
    Code.expect(payload.severity).to.equal('severe')
    Code.expect(payload.levels.length).to.equal(1)
    Code.expect(payload.levels[0].river_name).to.equal('Groundwater')
    Code.expect(payload.levels[0].isGroundwater).to.equal(true)
  })

  lab.test('GET /api/webchat/availability', async () => {
    const getAvailability = async () => ({ availability: 'AVAILABLE', date: new Date('2022-09-25T00:00:00.000Z') })

    const webchatService = require('../../server/services/webchat')
    sandbox.stub(webchatService, 'getAvailability').callsFake(getAvailability)

    const route = {
      plugin: {
        name: 'webchat',
        register: (server) => {
          server.route(require('../../server/routes/api/webchat-availability'))
        }
      }
    }

    await server.register(require('../../server/plugins/session'))
    await server.register(route)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/api/webchat/availability'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('{"availability":"AVAILABLE","date":"2022-09-25T00:00:00.000Z"}')
  })
})
