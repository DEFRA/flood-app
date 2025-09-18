'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const moment = require('moment')
const { parse } = require('node-html-parser')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

const data = require('../data')
const LocationSearchError = require('../../server/location-search-error')

describe('Route - Location', () => {
  let sandbox
  let server

  async function setup (fakeIsEngland, fakeFloodsData, fakeStationsData, fakeImpactsData, fakeOutlookData, fakeGetJson) {
    const floodService = require('../../server/services/flood')

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
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
  }

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]

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

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  describe('Legacy', () => {
    it('should 404 with invalid location', async () => {
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

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
          }
        }
      }

      await server.register(require('../../server/plugins/logging'))
      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/error-pages'))
      await server.register(locationPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/location?q=fkfflsdfk'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })

    it('should 301 redirect with valid location', async () => {
      const fakeGetJson = () => {
        return {
          authenticationResultCode: 'ValidCredentials',
          brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
          copyright: 'Copyright',
          resourceSets: [
            {
              estimatedTotal: 1,
              resources: [
                {
                  __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                  bbox: [54.18498992919922, -1.1886399984359741, 54.1898307800293, -1.1779199838638306],
                  name: 'Coxwold, North Yorkshire',
                  point: {
                    type: 'Point',
                    coordinates: [54.187835693359375, -1.182824969291687]
                  },
                  address: {
                    adminDistrict: 'England',
                    adminDistrict2: 'North Yorkshire',
                    countryRegion: 'United Kingdom',
                    formattedAddress: 'Coxwold, North Yorkshire',
                    locality: 'Coxwold',
                    countryRegionIso2: 'GB'
                  },
                  confidence: 'High',
                  entityType: 'PopulatedPlace',
                  geocodePoints: [
                    {
                      type: 'Point',
                      coordinates: [54.187835693359375, -1.182824969291687],
                      calculationMethod: 'Rooftop',
                      usageTypes: ['Display']
                    }
                  ],
                  matchCodes: ['Good']
                }
              ]
            }
          ],
          statusCode: 200,
          tatusDescription: 'OK',
          traceId: 'trace-id'
        }
      }

      const util = require('../../server/util')
      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
          }
        }
      }

      await server.register(require('../../server/plugins/logging'))
      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(require('../../server/plugins/error-pages'))
      await server.register(locationPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/location?location=coxwold'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/location/coxwold-north-yorkshire')
    })
  })

  describe('Invalid characters', () => {
    it('should 404 when entering non-alphanumeric characters', async () => {
      const options = {
        method: 'GET',
        url: '/location/,-+'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })

    it('should 404 when entering a query containing angle brackets', async () => {
      const options = {
        method: 'GET',
        url: '/location/<script>'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })
  })

  describe('Non-England Nations', () => {
    beforeEach(async () => {
      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []
      const fakeOutlookData = () => []
      const fakeGetJson = () => {}

      setup(fakeIsEngland, fakeFloodsData, fakeStationsData, fakeImpactsData, fakeOutlookData, fakeGetJson)
    })

    it('should 404 with location: Wales', async () => {
      const options = {
        method: 'GET',
        url: '/location/Wales'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })

    it('should 404 with location: Scotland', async () => {
      const options = {
        method: 'GET',
        url: '/location/Scotland'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })
  })

  describe('FGS', () => {
    it('should 200 with no riskAreas to hide outlook message IDs', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []

      const fakeOutlookData = () => {
        const outlook = {
          id: 1823,
          issued_at: '2021-03-22T10:30:00Z',
          pdf_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01823-2021-03-22_1030/fgs.pdf',
          detailed_csv_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01823-2021-03-22_1030/detailed.csv',
          area_of_concern_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01823-2021-03-22_1030/areaofconcern.jpg',
          flood_risk_trend: {
            day1: 'stable',
            day2: 'stable',
            day3: 'stable',
            day4: 'stable',
            day5: 'stable'
          },
          sources: [
            {
              ground: 'The groundwater flood risk is VERY LOW for the next five days. Groundwater levels are high in Hampshire and Kent and other parts of the south and east of England.'
            },
            {
              coastal: 'The coastal/tidal flood risk is VERY LOW for the next five days. '
            },
            {
              river: 'The river flood risk is VERY LOW for the next five days.'
            },
            {
              surface: 'The surface water flood risk is VERY LOW for the next five days.'
            }
          ],
          headline: 'The overall flood risk for England and Wales for the next five days is VERY LOW.',
          amendments: '',
          future_forecast: '',
          last_modified_at: '2021-03-22T10:02:50Z',
          next_issue_due_at: '2021-03-23T10:30:00Z',
          png_thumbnails_with_days_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01823-2021-03-22_1030/FGSthumbnails-with-days.png',
          risk_areas: [],
          aoc_maps: [],
          public_forecast: {
            id: 1823,
            england_forecast: 'The forecast flood risk across England and Wales for today and the next four days is very low.',
            welsh_forecast: 'Service unavailable',
            english_forecast: 'Service unavailable',
            wales_forecast_english: 'The forecast flood risk across Wales for today and the next four days is very low.',
            wales_forecast_welsh: "Rhagwelir fod y perygl llifogydd ar draws Cymru ar gyfer heddiw a'r pedwar diwrnod nesaf yn isel iawn.",
            published_at: '2021-03-22T10:06:15Z'
          }
        }
        outlook.issued_at = moment().utc()
        return outlook
      }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      floodService.outlook = await floodService.getOutlook()

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('The flood risk for the next 5 days is very low.')
    })

    it('should 200 with error message on empty data', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []

      const fakeOutlookData = () => {
        return {}
      }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      floodService.outlook = await floodService.getOutlook()

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })

    it('should 200 with error message on valid json but incorrect format', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []

      const fakeOutlookData = () => {
        const outlook = { statement: { id: '1234' } }
        return outlook.statement
      }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      floodService.outlook = await floodService.getOutlook()

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })

    it('should 200 with error message on invalid json', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []

      const fakeOutlookData = () => {
        return ''
      }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      floodService.outlook = await floodService.getOutlook()

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })

    it('should 200 with error message on valid json but missing "issue_date" and other fields', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []

      const fakeOutlookData = () => {
        const outlook = {
          id: 1830,
          // issued_at: '2021-04-06T09:30:00Z',
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
          public_forecast: { english_forecast: 'Good' },
          future_forecast: '',
          last_modified_at: '2021-03-29T09:18:29Z',
          next_issue_due_at: '2021-03-30T09:30:00Z',
          png_thumbnails_with_days_url: 'FGSthumbnails-with-days.png',
          risk_areas: []
        }
        return outlook
      }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      floodService.outlook = await floodService.getOutlook()

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Sorry, there is currently a problem with the data')
    })

    it('should 200 with error message on valid json but empty "risk_areas"', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []

      const fakeOutlookData = () => {
        const outlook = {
          id: 1830,
          issued_at: moment().utc(),
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

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      floodService.outlook = await floodService.getOutlook()

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('The flood risk for the next 5 days is very low.')
    })
  })

  it('should append location to river and sea levels link', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => {
      return { floods: [] }
    }

    const fakeStationsData = () => []
    const fakeImpactsData = () => []
    const fakeOutlookData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
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
      url: '/location/warrington'
    }

    const response = await server.inject(options)

    const root = parse(response.payload)
    const targetText = 'Find a river, sea, groundwater or rainfall level in this area'
    const anchor = root.querySelectorAll('a').find(a => a.text.trim() === targetText)

    expect(anchor.getAttribute('href')).to.equal('/river-and-sea-levels/warrington')
  })

  it('should 302 with no query parameters', async () => {
    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/logging'))
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register(locationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/location'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/')
  })

  it('should 404 with invalid location', async () => {
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

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register(locationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/location/xxxxxx'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(404)
    expect(response.payload).to.contain('Page not found')
  })

  it('should 200 with known and unknown query parameters', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => {
      return { floods: [] }
    }

    const fakeStationsData = () => []
    const fakeImpactsData = () => []
    const fakeOutlookData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
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
      url: '/location/Warrington?fbclid=*()*()*890890890'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
  })

  it('should 500 with no response from Bing', async () => {
    const fakeGetJson = () => {
      throw new LocationSearchError('Missing or corrupt contents from location search')
    }

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(require('../../server/plugins/error-pages'))
    await server.register(locationPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/location/liverpool'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(500)
    expect(response.payload).to.contain('<h1 class="govuk-heading-xl govuk-!-margin-bottom-2">Sorry, there is a problem with the search</h1>')
  })

  it('should 404 if not in England', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: false }
    }

    const fakeFloodsData = () => []
    const fakeStationsData = () => []
    const fakeImpactsData = () => []
    const fakeOutlookData = () => { }

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

    const fakeGetJson = () => data.scotlandGetJson

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
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
      url: '/location/Warrington'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(404)
  })

  it('should 200 with location-1sw-2w-1a', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeFloodsData = () => data.floodsData1SW2W1A

    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    sandbox.stub(floodService, 'getOutlook').callsFake(() => { })

    const fakeGetJson = () => data.warringtonGetJson

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
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
      url: '/location/Warrington'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('There is a danger to life')
    expect(response.payload).to.contain('Severe flood warning for ')
    expect(response.payload).to.contain('2 flood warnings')
    expect(response.payload).to.contain('1 flood alert')
  })

  it('should redirect to default page with parameter: England', async () => {
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

    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    await server.register(locationPlugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/location/England'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/')
  })

  describe('Alerts and Warnings', () => {
    it('should return no flood service data', async () => {
      const floodService = require('../../server/services/flood')

      const fakeGetJson = () => data.warringtonGetJson

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []
      const fakeOutlookData = () => { }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).not.to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/sign-up-for-flood-warnings">\s*Get flood warnings by phone, text or email\s*<\/a>/)
      expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/prepare-for-flooding">\s*Prepare for flooding\s*<\/a>/)
      expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/help-during-flood">\s*What to do before or during a flood\s*<\/a>/)
      expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/after-flood">\s*What to do after a flood\s*<\/a>/)
      expect(response.payload).not.to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/check-long-term-flood-risk">\s*Check your long term flood risk\s*<\/a>/)
      expect(response.payload).to.match(/<div class="defra-related-items">[\s\S]*?<a class="govuk-link" href="https:\/\/www\.gov\.uk\/report-flood-cause">\s*Report a flood\s*<\/a>/)
      expect(response.payload).to.contain('There are no flood warnings or alerts in this area.')
    })

    it('should return 1 alert 1 nlif (with station data)', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => data.fakeFloodsData

      const fakeStationsData = () => [
        {
          rloi_id: 6270,
          telemetry_id: 'E22163',
          region: 'Anglian',
          catchment: 'Cam and Ely Ouse (Including South Level)',
          wiski_river_name: 'River Little Ouse',
          agency_name: 'Knettishall',
          external_name: 'Knettishall',
          station_type: 'S',
          status: 'Active',
          qualifier: 'u',
          iswales: false,
          value: '0.584',
          value_timestamp: '2020-01-06T06:45:00.000Z',
          value_erred: false,
          percentile_5: '0.295000000000002',
          percentile_95: '0.0539999999999985'
        },
        {
          rloi_id: 6265,
          telemetry_id: 'E22152',
          region: 'Anglian',
          catchment: 'Cam and Ely Ouse (Including South Level)',
          wiski_river_name: 'River Thet',
          agency_name: 'Bridgham',
          external_name: 'Bridgham',
          station_type: 'S',
          status: 'Active',
          qualifier: 'u',
          iswales: false,
          value: '0.524',
          value_timestamp: '2020-01-06T06:00:00.000Z',
          value_erred: false,
          percentile_5: '0.503',
          percentile_95: '0.0999999999999996'
        }
      ]

      const fakeImpactsData = () => []

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(() => { })

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(200)

      expect(response.payload).to.contain('Flooding is expected')
      expect(response.payload).to.contain('<time datetime="">Up to date as of ')
    })

    it('should return 1 alert 1 nlif (with floods data)', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return {
          floods: [
            {
              ta_code: '122WAF948',
              ta_id: 4563104,
              ta_name: 'River Rye catchment',
              quick_dial: '134603',
              region: 'Midlands',
              area: 'Central',
              floodtype: 'f',
              severity_value: 1,
              severitydescription: 'Flood Alert',
              warningkey: 1,
              message_received: '2020-01-22T15:22:28.240Z',
              severity_changed: '2020-01-22T15:22:28.240Z',
              situation_changed: '2020-01-22T15:22:28.240Z',
              situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
                '\n' +
                'Quisque nec ultrices risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque viverra, tortor sit amet condimentum laoreet, lorem ante dictum ante, nec hendrerit nisl lacus sit amet diam. Praesent ut ornare lorem. Quisque placerat sollicitudin enim, sit amet laoreet enim consectetur in. Praesent nec nunc a ligula cursus cursus.\n' +
                '\n' +
                'Proin a dictum mauris, eget pulvinar augue. Pellentesque non lectus nibh. Pellentesque convallis ultricies enim, vel lacinia metus rhoncus vitae. Donec at porta tellus. In hac habitasse platea dictumst. Vestibulum mollis mollis nibh, sit amet maximus sem suscipit eu. Etiam elementum sed nulla quis tincidunt.'
            },
            {
              ta_code: '122WAF938',
              ta_id: 4563106,
              ta_name: 'River Wiske and tributaries',
              quick_dial: '135104',
              region: 'Midlands',
              area: 'Central',
              floodtype: 'f',
              severity_value: 1,
              severitydescription: 'Flood Alert',
              warningkey: 1,
              message_received: '2020-01-22T15:22:28.240Z',
              severity_changed: '2020-01-22T15:22:28.240Z',
              situation_changed: '2020-01-22T15:22:28.240Z',
              situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
                '\n' +
                'Quisque nec ultrices risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque viverra, tortor sit amet condimentum laoreet, lorem ante dictum ante, nec hendrerit nisl lacus sit amet diam. Praesent ut ornare lorem. Quisque placerat sollicitudin enim, sit amet laoreet enim consectetur in. Praesent nec nunc a ligula cursus cursus.\n' +
                '\n' +
                'Proin a dictum mauris, eget pulvinar augue. Pellentesque non lectus nibh. Pellentesque convallis ultricies enim, vel lacinia metus rhoncus vitae. Donec at porta tellus. In hac habitasse platea dictumst. Vestibulum mollis mollis nibh, sit amet maximus sem suscipit eu. Etiam elementum sed nulla quis tincidunt.'
            }
          ]
        }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []
      const fakeOutlookData = () => { }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => {
        return {
          authenticationResultCode: 'ValidCredentials',
          brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
          copyright: 'Copyright',
          resourceSets: [
            {
              estimatedTotal: 1,
              resources: [
                {
                  __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                  bbox: [54.18498992919922, -1.1886399984359741, 54.1898307800293, -1.1779199838638306],
                  name: 'Coxwold, North Yorkshire',
                  point: {
                    type: 'Point',
                    coordinates: [54.187835693359375, -1.182824969291687]
                  },
                  address: {
                    adminDistrict: 'England',
                    adminDistrict2: 'North Yorkshire',
                    countryRegion: 'United Kingdom',
                    formattedAddress: 'Coxwold, North Yorkshire',
                    locality: 'Coxwold',
                    countryRegionIso2: 'GB'
                  },
                  confidence: 'High',
                  entityType: 'PopulatedPlace',
                  geocodePoints: [
                    {
                      type: 'Point',
                      coordinates: [54.187835693359375, -1.182824969291687],
                      calculationMethod: 'Rooftop',
                      usageTypes: ['Display']
                    }
                  ],
                  matchCodes: ['Good']
                }
              ]
            }
          ],
          statusCode: 200,
          tatusDescription: 'OK',
          traceId: 'trace-id'
        }
      }

      const util = require('../../server/util')
      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/coxwold-north-yorkshire'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
    })

    it('should return 1 alert 1 nlif', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return {
          floods: [
            {
              ta_code: '053WAF117BED',
              ta_id: 180379,
              ta_name: 'Barlings Eau and Duckpool Catchwater',
              quick_dial: '207012',
              severity_value: 1,
              severitydescription: 'Flood Alert',
              message_received: '2020-01-06T11:58:00.000Z',
              severity_changed: '2019-11-07T15:43:00.000Z',
              situation_changed: '2020-01-06T11:58:00.000Z',
              situation: 'River levels remain high.  Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have repaired the breached banks at Short Ferry. However, Short Ferry road will remain closed for several weeks until the water has been pumped back into the river.  The pumps are operating again now that river levels have fallen sufficiently.  Do not walk on flood banks and please avoid using low lying footpaths near local watercourses, which may be flooded. We are monitoring river levels and will update this message on Tuesday 7th January, or as the situation changes.'
            }, {
              ta_code: '053WAF117BED',
              ta_id: 180379,
              ta_name: 'Barlings Eau and Duckpool Catchwater',
              quick_dial: '207012',
              severity_value: 4,
              severitydescription: 'No longer in force',
              warningkey: 108229,
              message_received: '2020-01-06T11:58:00.000Z',
              severity_changed: '2019-11-07T15:43:00.000Z',
              situation_changed: '2020-01-06T11:58:00.000Z',
              situation: 'River levels remain high.  Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have repaired the breached banks at Short Ferry. However, Short Ferry road will remain closed for several weeks until the water has been pumped back into the river.  The pumps are operating again now that river levels have fallen sufficiently.  Do not walk on flood banks and please avoid using low lying footpaths near local watercourses, which may be flooded. We are monitoring river levels and will update this message on Tuesday 7th January, or as the situation changes.'
            }
          ]
        }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []
      const fakeOutlookData = () => { }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Some flooding is possible')
      expect(response.payload).to.contain('There is a flood alert in this area')
      expect(response.payload).to.contain('<a href="/target-area/053WAF117BED">1 flood alert or warning was removed </a> in the last 24 hours.')
    })

    it('should return 1 warning 2 alerts 2 nlif', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return {
          floods: [
            {
              ta_code: '053WAF117BED',
              ta_id: 180379,
              ta_name: 'Barlings Eau and Duckpool Catchwater',
              quick_dial: '207012',
              region: 'Anglian',
              area: 'Northern',
              floodtype: 'f',
              severity_value: 2,
              severitydescription: 'Flood Warning',
              warningkey: 108229,
              message_received: '2020-01-06T11:58:00.000Z',
              severity_changed: '2019-11-07T15:43:00.000Z',
              situation_changed: '2020-01-06T11:58:00.000Z',
              situation: 'River levels remain high.  Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have repaired the breached banks at Short Ferry. However, Short Ferry road will remain closed for several weeks until the water has been pumped back into the river.  The pumps are operating again now that river levels have fallen sufficiently.  Do not walk on flood banks and please avoid using low lying footpaths near local watercourses, which may be flooded. We are monitoring river levels and will update this message on Tuesday 7th January, or as the situation changes.'
            },
            {
              ta_code: '053WAF116TLW',
              ta_id: 180378,
              ta_name: 'Lower River Witham',
              quick_dial: '207011',
              region: 'Anglian',
              area: 'Northern',
              floodtype: 'f',
              severity_value: 1,
              severitydescription: 'Flood Alert',
              warningkey: 108310,
              message_received: '2020-01-06T11:54:00.000Z',
              severity_changed: '2019-11-07T20:46:00.000Z',
              situation_changed: '2020-01-06T11:54:00.000Z',
              situation: 'River levels remain high. Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have undertaken repairs to the breach at Timberland Delph and on the Barlings Eau.  Flooding of low lying land and roads close to the river remains a possibility.  We are monitoring the situation.  Do not walk on flood banks and avoid using low lying footpaths and roads near to watercourses.  This message will be updated on Tuesday, 7th January, or as the situation changes.'
            },
            {
              ta_code: '053WAF116TLW',
              ta_id: 180378,
              ta_name: 'Lower River Witham',
              quick_dial: '207011',
              region: 'Anglian',
              area: 'Northern',
              floodtype: 'f',
              severity_value: 1,
              severitydescription: 'Flood Alert',
              warningkey: 108310,
              message_received: '2020-01-06T11:54:00.000Z',
              severity_changed: '2019-11-07T20:46:00.000Z',
              situation_changed: '2020-01-06T11:54:00.000Z',
              situation: 'River levels remain high. Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have undertaken repairs to the breach at Timberland Delph and on the Barlings Eau.  Flooding of low lying land and roads close to the river remains a possibility.  We are monitoring the situation.  Do not walk on flood banks and avoid using low lying footpaths and roads near to watercourses.  This message will be updated on Tuesday, 7th January, or as the situation changes.'
            },
            {
              ta_code: '053WAF116TLW',
              ta_id: 180378,
              ta_name: 'Lower River Witham',
              quick_dial: '207011',
              region: 'Anglian',
              area: 'Northern',
              floodtype: 'f',
              severity_value: 4,
              severitydescription: 'No Longer in force',
              warningkey: 108310,
              message_received: '2020-01-06T11:54:00.000Z',
              severity_changed: '2019-11-07T20:46:00.000Z',
              situation_changed: '2020-01-06T11:54:00.000Z',
              situation: 'River levels remain high. Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have undertaken repairs to the breach at Timberland Delph and on the Barlings Eau.  Flooding of low lying land and roads close to the river remains a possibility.  We are monitoring the situation.  Do not walk on flood banks and avoid using low lying footpaths and roads near to watercourses.  This message will be updated on Tuesday, 7th January, or as the situation changes.'
            },
            {
              ta_code: '053WAF116TLW',
              ta_id: 180378,
              ta_name: 'Lower River Witham',
              quick_dial: '207011',
              region: 'Anglian',
              area: 'Northern',
              floodtype: 'f',
              severity_value: 4,
              severitydescription: 'No longer in force',
              warningkey: 108310,
              message_received: '2020-01-06T11:54:00.000Z',
              severity_changed: '2019-11-07T20:46:00.000Z',
              situation_changed: '2020-01-06T11:54:00.000Z',
              situation: 'River levels remain high. Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have undertaken repairs to the breach at Timberland Delph and on the Barlings Eau.  Flooding of low lying land and roads close to the river remains a possibility.  We are monitoring the situation.  Do not walk on flood banks and avoid using low lying footpaths and roads near to watercourses.  This message will be updated on Tuesday, 7th January, or as the situation changes.'
            }
          ]
        }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []
      const fakeOutlookData = () => { }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain(' also in the wider area, where some flooding is possible.')
      expect(response.payload).to.contain('Flood warning for')
      expect(response.payload).to.contain('Flood alerts and warnings were removed')
      expect(response.payload).to.contain('in the last 24 hours')
    })

    it('should return no warnings', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return { floods: [] }
      }

      const fakeStationsData = () => {
        return [
          {
            rloi_id: 6270,
            telemetry_id: 'E22163',
            region: 'Anglian',
            catchment: 'Cam and Ely Ouse (Including South Level)',
            wiski_river_name: 'River Little Ouse',
            agency_name: 'Knettishall',
            external_name: 'Knettishall',
            station_type: 'S',
            status: 'Active',
            qualifier: 'u',
            iswales: false,
            value: '0.584',
            value_timestamp: '2020-01-06T06:45:00.000Z',
            value_erred: false,
            percentile_5: '0.295000000000002',
            percentile_95: '0.0539999999999985'
          },
          {
            rloi_id: 6265,
            telemetry_id: 'E22152',
            region: 'Anglian',
            catchment: 'Cam and Ely Ouse (Including South Level)',
            wiski_river_name: 'River Thet',
            agency_name: 'Bridgham',
            external_name: 'Bridgham',
            station_type: 'S',
            status: 'Active',
            qualifier: 'u',
            iswales: false,
            value: '0.524',
            value_timestamp: '2020-01-06T06:00:00.000Z',
            value_erred: false,
            percentile_5: '0.503',
            percentile_95: '0.0999999999999996'
          }
        ]
      }

      const fakeImpactsData = () => []

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(() => { })

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('There are no flood warnings or alerts in this area but some')
    })

    it('should return 2 severe warnings', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => {
        return {
          floods: [
            {
              ta_code: '053WAF117BED',
              ta_id: 180379,
              ta_name: 'Barlings Eau and Duckpool Catchwater',
              quick_dial: '207012',
              region: 'Anglian',
              area: 'Northern',
              floodtype: 'f',
              severity_value: 3,
              severitydescription: 'Severe Flood Warning',
              warningkey: 108229,
              message_received: '2020-01-06T11:58:00.000Z',
              severity_changed: '2019-11-07T15:43:00.000Z',
              situation_changed: '2020-01-06T11:58:00.000Z',
              situation: 'River levels remain high.  Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have repaired the breached banks at Short Ferry. However, Short Ferry road will remain closed for several weeks until the water has been pumped back into the river.  The pumps are operating again now that river levels have fallen sufficiently.  Do not walk on flood banks and please avoid using low lying footpaths near local watercourses, which may be flooded. We are monitoring river levels and will update this message on Tuesday 7th January, or as the situation changes.'
            },
            {
              ta_code: '053WAF116TLW',
              ta_id: 180378,
              ta_name: 'Lower River Witham',
              quick_dial: '207011',
              region: 'Anglian',
              area: 'Northern',
              floodtype: 'f',
              severity_value: 3,
              severitydescription: 'Severe Flood Alert',
              warningkey: 108310,
              message_received: '2020-01-06T11:54:00.000Z',
              severity_changed: '2019-11-07T20:46:00.000Z',
              situation_changed: '2020-01-06T11:54:00.000Z',
              situation: 'River levels remain high. Heavy rain is forecast for Wednesay 8th and Thursday 9th January and we continue to monitor the situation. Environment Agency contractors have undertaken repairs to the breach at Timberland Delph and on the Barlings Eau.  Flooding of low lying land and roads close to the river remains a possibility.  We are monitoring the situation.  Do not walk on flood banks and avoid using low lying footpaths and roads near to watercourses.  This message will be updated on Tuesday, 7th January, or as the situation changes.'
            }
          ]
        }
      }

      const fakeStationsData = () => []
      const fakeImpactsData = () => []
      const fakeOutlookData = () => { }

      sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
      sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
      sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
      sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
      sandbox.stub(floodService, 'getOutlook').callsFake(fakeOutlookData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      sandbox.stub(util, 'getJson').callsFake(fakeGetJson)

      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server) => {
            server.route(require('../../server/routes/location'))
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
        url: '/location/Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('2 severe flood warnings')
      expect(response.payload).to.contain('There is a danger to life')
    })
  })
})
