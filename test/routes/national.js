'use strict'
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const moment = require('moment')

lab.experiment('Routes test - national view', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/routes/national.js')]

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

  lab.experiment('GET', () => {
    lab.test('GET /national view no outlook data', async () => {
      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }
      const floodService = require('../../server/services/flood')
      // Create dummy flood data in place of cached data
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        return {}
      }

      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)
      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)
      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.payload).to.contain('No flood alerts or warnings')
      Code.expect(response.payload).to.contain('Call Floodline for advice')
      Code.expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })
    lab.test('GET /national view no alerts or warnings', async () => {
      // Create dummy flood data in place of cached data
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        const outlook = require('../data/outlook.json')
        return outlook.statements[0]
      }

      const floodService = require('../../server/services/flood')
      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)
      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)
      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.payload).to.contain('No flood alerts or warnings')
      Code.expect(response.payload).to.contain('Call Floodline for advice')
    })
    lab.test('GET /national view with incorrect outlook structure', async () => {
      // Create dummy flood data in place of cached data
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        const outlook = []
        return outlook
      }

      const floodService = require('../../server/services/flood')
      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)
      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)
      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.payload).to.contain('No flood alerts or warnings')
      Code.expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })
    lab.test('GET /national view with valid json but incorrect format', async () => {
      // Create dummy flood data in place of cached data
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        const outlook = { statement: { id: '1234' } }
        return outlook
      }

      const floodService = require('../../server/services/flood')
      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)
      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)
      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.payload).to.contain('No flood alerts or warnings')
      Code.expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })
    lab.test('GET /national view with valid fgs but no risk_areas', async () => {
      // Create dummy flood data in place of cached data
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        const outlook = {
          id: 1830,
          issued_at: '2021-04-06T09:30:00Z',
          pdf_url: 'fgs.pdf',
          detailed_csv_url: 'fgs-statements/01830-2021-03-29_1030/detailed.csv',
          area_of_concern_url: 'areaofconcern.jpg',
          flood_risk_trend: { day1: 'stable', day2: 'stable', day3: 'stable', day4: 'stable', day5: 'stable' },
          sources: [
            { river: 'The river flood risk is VERY LOW for the next five days.' },
            { coastal: 'The coastal/tidal flood risk is VERY LOW for the next five days.' },
            { ground: 'The groundwater flood risk is VERY LOW for the next five days.' }
          ],
          headline: 'Minor river flooding is possible',
          amendments: '',
          public_forecast: { england_forecast: 'Good' },
          future_forecast: '',
          last_modified_at: '2021-03-29T09:18:29Z',
          next_issue_due_at: '2021-03-30T09:30:00Z',
          png_thumbnails_with_days_url: 'FGSthumbnails-with-days.png',
          risk_areas: []
        }
        return outlook
      }

      const floodService = require('../../server/services/flood')
      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)
      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)
      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.payload).to.contain('No flood alerts or warnings')
      Code.expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })
    lab.test('GET national view with FGS stale data warning', async () => {
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        const outlook = require('../data/outlook.json')
        outlook.statements[0].issued_at = moment().utc().subtract(3, 'days').format()
        return outlook.statements[0]
      }

      const floodService = require('../../server/services/flood')
      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)

      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">Sorry, there is currently a problem with the data</h2>')
      Code.expect(response.payload).to.contain('<p class="govuk-body govuk-!-margin-bottom-0">There is no recent data.</p>')
    })
  })
  lab.experiment('POST', () => {
    lab.test('an empty location will not result in a redirect away from the page', async () => {
      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }
      const floodService = require('../../server/services/flood')
      // Create dummy flood data in place of cached data
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        return {}
      }

      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)
      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)
      await server.initialize()

      const options = {
        method: 'POST',
        url: '/',
        payload: {
          location: ''
        }
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.request.url.pathname).to.equal('/')
    })
    lab.test('a non-empty location will result in a redirect to the location page', async () => {
      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server, options) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }
      const floodService = require('../../server/services/flood')
      // Create dummy flood data in place of cached data
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        return {}
      }

      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)
      // Add Cache methods to server
      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)
      await server.initialize()

      const options = {
        method: 'POST',
        url: '/',
        payload: {
          location: 'test'
        }
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(302)
      Code.expect(response.headers.location).to.equal('/location?q=test')
    })
  })
})
