'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const moment = require('moment-timezone')
const { parse } = require('node-html-parser')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

const config = require('../../server/config')
const flushAppRequireCache = require('../lib/flush-app-require-cache')

const fgs = require('../data/fgs.json')
const floods = require('../data/floods.json')

function formatDate (date) {
  return moment.tz(date, 'Europe/London').format('h:mma [on] D MMMM YYYY')
}

describe('Route - National (formatDate)', () => {
  it('before midday', async () => { expect(formatDate(new Date('2024-04-10T09:00:00'))).to.equal('9:00am on 10 April 2024') })
  it('midday', async () => { expect(formatDate(new Date('2024-04-10T12:00:00'))).to.equal('12:00pm on 10 April 2024') })
  it('after midday', async () => { expect(formatDate(new Date('2024-04-10T19:00:00'))).to.equal('7:00pm on 10 April 2024') })
  it('midnight', async () => { expect(formatDate(new Date('2024-04-10T00:00:00'))).to.equal('12:00am on 10 April 2024') })
  it('invalid date (documenting conterintuitive js date handling)', async () => { expect(formatDate(new Date('2024-04-31T00:00:00'))).to.equal('12:00am on 1 May 2024') })
})

describe('Route - National', () => {
  let sandbox
  let server

  async function setup (fakeFloodData, fakeOutlookData, fakeSearchData) {
    flushAppRequireCache()

    sandbox.stub(config, 'floodRiskUrl').value('http://server/cyltfr')

    const floodService = require('../../server/services/flood')
    const locationService = require('../../server/services/location')

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)
    sandbox.stub(locationService, 'find').callsFake(fakeSearchData)

    const nationalPlugin = {
      plugin: {
        name: 'national',
        register: (server) => {
          server.route(require('../../server/routes/national'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register(nationalPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
  }

  beforeEach(async () => {
    sandbox = await sinon.createSandbox()

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  describe('GET', () => {
    describe('with flood and outlook data', () => {
      const context = {}

      beforeEach(async () => {
        const fakeFloodData = () => { return floods }

        const fakeOutlookData = () => {
          context.now = new Date()
          return { ...fgs, issued_at: context.now.toISOString() }
        }

        setup(fakeFloodData, fakeOutlookData)
      })

      it('should contain CYLTFR link taken from the floodRiskUrl config value', async () => {
        const options = {
          method: 'GET',
          url: '/'
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)

        const root = parse(response.payload)
        const link = root.querySelectorAll('a').find(a => a.text.trim() === 'Check your long term flood risk')

        expect(link).to.exist()
        expect(link.getAttribute('href')).to.equal('http://server/cyltfr')
      })

      it('should display updated time and date for flood warnings', async () => {
        const options = {
          method: 'GET',
          url: '/'
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)

        const root = parse(response.payload)
        const updateParagraphs = root.querySelectorAll('p.defra-flood-meta')

        expect(updateParagraphs.length).to.equal(2)
        // note: it is possible for the expectation below to fail if the minute ticks over between to setting of
        // context.now and the use of moment() within the code to set the flood update string
        expect(updateParagraphs[0].text).to.contain(`Updated at ${formatDate(context.now)}`)
      })

      it('should display updated time and date for outlook', async () => {
        const options = {
          method: 'GET',
          url: '/'
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)

        const root = parse(response.payload)
        const updateParagraphs = root.querySelectorAll('p.defra-flood-meta')

        expect(updateParagraphs.length).to.equal(2)
        expect(updateParagraphs[1].text).to.contain(`Updated at ${formatDate(context.now)}`)
        expect(updateParagraphs[1].text).to.contain('Produced by the Met Office and Environment Agency')
      })
    })

    describe('without flood and outlook data', () => {
      beforeEach(async () => {
        const fakeFloodData = () => {
          return {
            floods: []
          }
        }

        const fakeOutlookData = () => {
          return {}
        }

        setup(fakeFloodData, fakeOutlookData)
      })

      it('should 200', async () => {
        const options = {
          method: 'GET',
          url: '/'
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.payload).to.contain('No flood alerts or warnings')
      })

      it('should not contain CYLTFR link', async () => {
        const options = {
          method: 'GET',
          url: '/'
        }

        const response = await server.inject(options)
        const root = parse(response.payload)

        expect(response.statusCode).to.equal(200)
        expect(root.querySelectorAll('.defra-related-items a').find(a => a.text.trim() === 'Check your long term flood risk')).to.not.exist()
      })
    })

    it('should return no alerts or warnings', async () => {
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
          register: (server) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('No flood alerts or warnings')
      expect(response.payload).to.contain('Contact Floodline for advice')
    })

    it('should 200 with valid json but incorrect format', async () => {
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        return { statement: { id: '1234' } }
      }

      const floodService = require('../../server/services/flood')

      sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const locationPlugin = {
        plugin: {
          name: 'national',
          register: (server) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('No flood alerts or warnings')
      expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })

    it('should 200 with valid FGS but no risk_areas', async () => {
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
          register: (server) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('No flood alerts or warnings')
      expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })

    it('should 200 view with FGS stale data warning', async () => {
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
          register: (server) => {
            server.route(require('../../server/routes/national'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/logging'))
      await server.register(locationPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('<h2 class="defra-service-error__title" id="error-summary-title">Sorry, there is currently a problem with the data</h2>')
      expect(response.payload).to.contain('<p class="govuk-body govuk-!-margin-bottom-0">There is no recent data.</p>')
    })
  })

  describe('POST', () => {
    describe('without flood or outlook data', () => {
      beforeEach(async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        const fakeSearchData = () => {
          return [
            {
              name: 'Ashford, Kent',
              slug: 'ashford-kent',
              center: [0.87279475, 51.14772797],
              bbox2k: [
                0.80935719234919,
                51.106071366450024,
                0.9551791288139874,
                51.19515238842755
              ],
              bbox10k: [
                0.6945958802395501,
                51.034125753112406,
                1.0699404409236273,
                51.267098001671634
              ],
              isUK: true,
              isEngland: { is_england: true }
            }
          ]
        }

        setup(fakeFloodData, fakeOutlookData, fakeSearchData)
      })

      it('should 200 and not redirect with an empty location', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: ''
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.request.url.pathname).to.equal('/')
      })

      it('should 200 and not redirect with "england" location', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: 'England'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.request.url.pathname).to.equal('/')
      })

      it('should 200 and not redirect with "england" (with spaces)', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: ' England  '
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.request.url.pathname).to.equal('/')
      })

      it('should redirect to location page on valid location', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: 'ashford, kent'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(302)
        expect(response.headers.location).to.equal('/location/ashford-kent')
      })
    })

    describe('scottish results', () => {
      beforeEach(async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        const fakeSearchData = () => {
          return [
            {
              name: 'Glasgow',
              center: [0.87279475, 51.14772797],
              bbox2k: [
                0.80935719234919,
                51.106071366450024,
                0.9551791288139874,
                51.19515238842755
              ],
              bbox10k: [
                0.6945958802395501,
                51.034125753112406,
                1.0699404409236273,
                51.267098001671634
              ],
              isUK: true,
              isScotlandOrNorthernIreland: true,
              isEngland: { is_england: false }
            }
          ]
        }

        setup(fakeFloodData, fakeOutlookData, fakeSearchData)
      })

      it('should 200 and not redirect with a scottish location', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: 'glasgow'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.request.url.pathname).to.equal('/')
        expect(response.payload).to.contain("We couldn't find 'glasgow', England")
      })
    })

    describe('empty results', () => {
      beforeEach(async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        const fakeSearchData = () => { return [] }

        setup(fakeFloodData, fakeOutlookData, fakeSearchData)
      })

      it('should 200 and not redirect with a non-match location', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: 'fhfhsflkh'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.request.url.pathname).to.equal('/')
        expect(response.payload).to.contain("We couldn't find 'fhfhsflkh', England")
      })
    })
  })
})
