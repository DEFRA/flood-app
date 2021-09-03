'use strict'
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('API routes test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]

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
})
