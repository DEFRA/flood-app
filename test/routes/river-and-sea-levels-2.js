'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - /river-and-sea-levels', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/river-and-sea-levels.js')]
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

  lab.test('GET /river-and-sea-levels for No river or sea levels found', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)

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
                bbox: [55.06072998046875, 98.83721160888672, 55.085941314697266, 98.87950134277344],
                name: 'Uk, Russia',
                point: {
                  type: 'Point',
                  coordinates: [55.082061767578125, 98.86390686035156]
                },
                address: {
                  adminDistrict: 'Irkutsk',
                  adminDistrict2: 'Russia',
                  countryRegion: 'Russia',
                  formattedAddress: 'Uk, Russia',
                  locality: 'uk',
                  countryRegionIso2: 'uk'
                },
                confidence: 'low',
                entityType: 'PopulatedPlace',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [55.082061767578125, 98.86390686035156],
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
        name: 'river-and-sea-levels',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(locationPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=rtgartgregqwre&type=location'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('0 levels')
    Code.expect(response.payload).to.contain('No river, sea or groundwater levels found.')
    Code.expect(response.payload).to.contain('Improve your search results by:')
  })
})
