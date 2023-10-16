'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Test - /alerts-warnings', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
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

  lab.test('GET /alerts-and-warnings with query parameters of Warrington and no warnings or alerts', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => {
      return { floods: [] }
    }
    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No alerts or warnings')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings TYPO or non location "afdv vdaf adfv  fda" ', async () => {
    const fakeGetJson = () => data.nonLocationGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=wefwe%20we%20fwef%20str'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('No alerts or warnings')
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

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=kinghorn'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('If you searched a place in England, you should:')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with query parameters, show alert, warnings and severe', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => data.fakeFloodsData

    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('1 flood warning')
    Code.expect(response.payload).to.contain('1 severe flood warning')
    Code.expect(response.payload).to.contain('3 flood alerts')
    Code.expect(response.payload).to.contain('1 flood warning removed')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFGL" class="defra-flood-warnings-list-item__title">River Glaze catchment including Leigh and East Wigan</a>')
    Code.expect(response.payload).to.contain('<a href="/target-area/013FWFCH29" class="defra-flood-warnings-list-item__title">Wider area at risk from Sankey Brook at Dallam</a>')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFDI" class="defra-flood-warnings-list-item__title">River Ditton catchment including areas around Huyton-with-Roby and Widnes</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with query parameters of WA4 1HT', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => data.floodsByPostCode

    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('4 flood alerts')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFLM" class="defra-flood-warnings-list-item__title">Lower River Mersey including Warrington, Runcorn and Lymm areas</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings Bing returns error', async () => {
    const floodService = require('../../server/services/flood')

    const fakeGetJson = () => {
      throw new Error('Bing error')
    }

    const fakeFloodsData = () => {
      return {
        floods: []
      }
    }

    const util = require('../../server/util')
    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodsData)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location - GOV.UK')
    Code.expect(response.payload).to.contain('Sorry, there is currently a problem searching a location')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings - England parameter query', async () => {
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

    const fakeOutlookData = () => {
      const outlook = require('../data/outlook.json')
      return outlook.statements[0]
    }

    const floodService = require('../../server/services/flood')
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=England'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('1 flood warning')
  })
  lab.test('GET /alerts-and-warnings ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodsData = () => {
      return {
        floods: []
      }
    }

    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings'
    }

    const response = await server.inject(options)
    Code.expect(response.payload).to.contain('No flood alerts or warnings')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings?station=1001 ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationById = () => data.fakeGetStationById

    const fakeAlertsWithinBuffer = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationById)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeAlertsWithinBuffer)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?station=1001'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Beeding Bridge - flood alerts and warnings - GOV.UK')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /alerts-and-warnings with unknown parameter e.g. facebook click id ', async () => {
    const floodService = require('../../server/services/flood')

    const fakeStationById = () => data.fakeGetStationById

    const fakeAlertsWithinBuffer = () => []

    sandbox.stub(floodService, 'getStationById').callsFake(fakeStationById)
    sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer').callsFake(fakeAlertsWithinBuffer)

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(warningsPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?station=1001&fbclid=76896789uyuioyuioy&&&'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Beeding Bridge - flood alerts and warnings - GOV.UK')
    Code.expect(response.statusCode).to.equal(200)
  })
})
