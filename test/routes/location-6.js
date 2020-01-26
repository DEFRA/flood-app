'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Routes test - location - 1 alert 1 nlif', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
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

  lab.test('GET /location with query parameters check for 1 alert 1 nlif', async () => {
    // Tests known location

    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }
    // const fakePlaceData = () => {}
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
                bbox: [53.367538452148437, -2.6395580768585205, 53.420841217041016, -2.5353000164031982],
                name: 'Warrington, Warrington',
                point: {
                  type: 'Point',
                  coordinates: [53.393871307373047, -2.5893499851226807]
                },
                address: {
                  adminDistrict: 'England',
                  adminDistrict2: 'Warrington',
                  countryRegion: 'United Kingdom',
                  formattedAddress: 'Warrington, Warrington',
                  locality: 'Warrington',
                  countryRegionIso2: 'GB'
                },
                confidence: 'Medium',
                entityType: 'PopulatedPlace',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [53.393871307373047, -2.5893499851226807],
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
        register: (server, options) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(locationPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/location?q=Warrington'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('View river and sea levels in this area')
    Code.expect(response.payload).to.not.contain('View river and sea levels in the wider area')

    Code.expect(response.payload).to.contain('There is a danger to life')
  })
})
