'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Test - alerts - warnings', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
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

  lab.test('GET /alerts-and-warnings with query parameters of Cheshire', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }
    // const fakePlaceData = () => {}
    const fakeFloodsData = () => data.floodsByCounty

    const fakeStationsData = () => []
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
                bbox: [52.94717025756836, -3.1310698986053467, 53.4810791015625, -1.9720499515533447],
                name: 'Cheshire, United Kingdom',
                point: {
                  type: 'Point',
                  coordinates: [53.098880767822266, -2.3384079933166504]
                },
                address: {
                  adminDistrict: 'England',
                  adminDistrict2: 'Cheshire',
                  countryRegion: 'United Kingdom',
                  formattedAddress: 'Cheshire, United Kingdom',
                  countryRegionIso2: 'GB'
                },
                confidence: 'High',
                entityType: 'AdminDivision2',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [53.098880767822266, -2.3384079933166504],
                    calculationMethod: 'None',
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
    await server.register(warningsPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('33 results')
    Code.expect(response.payload).to.contain('3 severe flood warnings')
    Code.expect(response.payload).to.contain('18 flood alerts')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WATDEE">Dee Estuary from Parkgate to Chester</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
})
