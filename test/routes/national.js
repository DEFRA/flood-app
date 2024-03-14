'use strict'
const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const moment = require('moment')
const { parse } = require('node-html-parser')

const fgs = require('../data/fgs.json')
const floods = require('../data/floods.json')

// function provided by chatgpt
function formatDate (date) {
  const hours24 = date.getHours()
  const hours12 = hours24 === 0 ? 12 : (hours24 > 12 ? hours24 - 12 : hours24)
  const minutes = date.getMinutes()
  const ampm = hours24 >= 12 ? 'pm' : 'am'

  const time = `${hours12}:${minutes.toString().padStart(2, '0')}${ampm}`

  const dateString = date
    .toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(',', '')

  return `${time} on ${dateString}`
}
lab.experiment('Routes test - national view', () => {
  let sandbox
  let server

  async function setup (fakeFloodData, fakeOutlookData) {
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

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register(locationPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)
    await server.initialize()
  }

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
    lab.experiment('with flood and outlook data', () => {
      const context = {}

      lab.beforeEach(async () => {
        const fakeFloodData = () => { return floods }
        const fakeOutlookData = () => {
          context.now = new Date()
          return { ...fgs, issued_at: context.now.toISOString() }
        }
        setup(fakeFloodData, fakeOutlookData)
      })
      lab.test('national view should display updated time and date for flood warnings', async () => {
        const options = {
          method: 'GET',
          url: '/'
        }

        const response = await server.inject(options)

        Code.expect(response.statusCode).to.equal(200)
        const root = parse(response.payload)
        const updateParagraphs = root.querySelectorAll('p.defra-flood-meta')
        Code.expect(updateParagraphs.length).to.equal(2)
        // note: it is possible for the expectation below to fail if the minute ticks over between to setting of
        // context.now and the use of moment() within the code to set the flood update string
        Code.expect(updateParagraphs[0].text).to.contain(`Updated at ${formatDate(context.now)}`)
      })
      lab.test('national view should display updated time and date for outlook', async () => {
        const options = {
          method: 'GET',
          url: '/'
        }

        const response = await server.inject(options)

        Code.expect(response.statusCode).to.equal(200)
        const root = parse(response.payload)
        const updateParagraphs = root.querySelectorAll('p.defra-flood-meta')
        Code.expect(updateParagraphs.length).to.equal(2)
        Code.expect(updateParagraphs[1].text).to.contain(`Updated at ${formatDate(context.now)}`)
        Code.expect(updateParagraphs[1].text).to.contain('Produced by the Met Office and Environment Agency')
      })
    })
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
    lab.experiment('No flood or outlook data', () => {
      lab.beforeEach(async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        setup(fakeFloodData, fakeOutlookData)
      })
      lab.test('an empty location will not result in a redirect away from the page', async () => {
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
      lab.test('the search term England will not result in a redirect away from the page', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: 'England'
          }
        }

        const response = await server.inject(options)

        Code.expect(response.statusCode).to.equal(200)
        Code.expect(response.request.url.pathname).to.equal('/')
      })
      lab.test('the search term England with spaces will not result in a redirect away from the page', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: ' England  '
          }
        }

        const response = await server.inject(options)

        Code.expect(response.statusCode).to.equal(200)
        Code.expect(response.request.url.pathname).to.equal('/')
      })
      lab.test('a non-empty location should result in a redirect to the location page', async () => {
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
})
