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
          server.route(require('../../server/routes/outside-england'))
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

        await setup(fakeFloodData, fakeOutlookData)
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

    it('should 200 and omit the no-border class when flood warnings have been removed', async () => {
      const fakeFloodData = () => ({
        floods: [{
          ta_id: 1,
          ta_code: 'TEST001',
          ta_name: 'Test Removed Area',
          severity_value: 4,
          severity: 'Flood warning removed',
          situation_changed: '2024-01-13T10:02:00.000Z',
          severity_changed: '2024-01-13T10:02:00.000Z',
          message_received: '2024-01-18T10:02:23.429Z',
          geometry: null
        }]
      })
      const fakeOutlookData = () => ({})

      await setup(fakeFloodData, fakeOutlookData)

      const response = await server.inject({ method: 'GET', url: '/' })

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.not.contain('defra-flood-meta--no-border')
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

        await setup(fakeFloodData, fakeOutlookData)
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

    it('should 200 when outlook service throws and render data problem message', async () => {
      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      const fakeOutlookData = () => {
        throw new Error('Outlook service unavailable')
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
      expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
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

        await setup(fakeFloodData, fakeOutlookData, fakeSearchData)
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

      it('should redirect to location page when location is provided with error flag', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: 'ashford, kent',
            error: '1'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(302)
        expect(response.headers.location).to.equal('/location/ashford-kent')
      })

      it('should display error message when geolocation is unavailable', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: '',
            error: '1'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.payload).to.contain('Turn on location services to use your current location, or enter a town, city or postcode in England')
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

        await setup(fakeFloodData, fakeOutlookData, fakeSearchData)
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

        await setup(fakeFloodData, fakeOutlookData, fakeSearchData)
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

      it('should 200 and not redirect with an invalid postcode', async () => {
        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: 'SW1A 9ZZ'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(200)
        expect(response.request.url.pathname).to.equal('/')
        expect(response.payload).to.contain("We couldn't find 'SW1A 9ZZ', England")
      })
    })

    describe('coordinate results', () => {
      it('should 400 with invalid geolocation payload format', async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        const fakeSearchData = () => {
          return [
            {
              name: 'Test Place',
              slug: 'test-place',
              isEngland: { is_england: true }
            }
          ]
        }

        await setup(fakeFloodData, fakeOutlookData, fakeSearchData)

        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: '',
            geolocation: 'invalid-coordinates'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(400)
      })

      it('should redirect to outside-england when coordinate lookup returns no match', async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        const fakeSearchData = () => { return [] }

        await setup(fakeFloodData, fakeOutlookData, fakeSearchData)

        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: '',
            geolocation: '55.8609,-4.2514'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(302)
        expect(response.headers.location).to.equal('/outside-england')
      })

      it('should redirect to location page with encoded slug for valid coordinate location', async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        const fakeSearchData = () => {
          return [
            {
              name: 'Test Place',
              slug: 'name with spaces',
              isEngland: { is_england: true }
            }
          ]
        }

        await setup(fakeFloodData, fakeOutlookData, fakeSearchData)

        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: '',
            geolocation: '51.5007,-0.1246'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(302)
        expect(response.headers.location).to.equal('/location/name%20with%20spaces')
      })

      it('should render the outside-england page when coordinate is outside England', async () => {
        const fakeFloodData = () => { return { floods: [] } }
        const fakeOutlookData = () => { return {} }
        const fakeSearchData = () => {
          return [
            {
              name: 'Glasgow',
              isEngland: { is_england: false }
            }
          ]
        }

        await setup(fakeFloodData, fakeOutlookData, fakeSearchData)

        const options = {
          method: 'POST',
          url: '/',
          payload: {
            location: '',
            geolocation: '55.8609,-4.2514'
          }
        }

        const response = await server.inject(options)

        expect(response.statusCode).to.equal(302)
        expect(response.headers.location).to.equal('/outside-england')

        const outsideEnglandResponse = await server.inject({
          method: 'GET',
          url: '/outside-england'
        })

        expect(outsideEnglandResponse.statusCode).to.equal(200)
        expect(outsideEnglandResponse.request.url.pathname).to.equal('/outside-england')
        expect(outsideEnglandResponse.payload).to.contain('This service is for locations in England')
      })
    })
  })
})
