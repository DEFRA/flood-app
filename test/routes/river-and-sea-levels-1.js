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

  lab.test('GET /river-and-sea-levels for Warrington', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }

    const fakeStationsData = () => [
      {
        rloi_id: 5050,
        telemetry_id: '694063',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Fiddlers Ferry',
        external_name: 'Fiddlers Ferry',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '3.427',
        value_timestamp: '2020-01-31T15:00:00.000Z',
        value_erred: false,
        percentile_5: '6.2',
        percentile_95: '2.611'
      },
      {
        rloi_id: 5149,
        telemetry_id: '693976',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'River Mersey',
        agency_name: 'Westy',
        external_name: 'Westy',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '4',
        value_timestamp: '2020-01-31T15:30:00.000Z',
        value_erred: false,
        percentile_5: '4.14',
        percentile_95: '3.548'
      },
      {
        rloi_id: 5031,
        telemetry_id: '694039',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Causey Bridge',
        external_name: 'Causey Bridge',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.358',
        value_timestamp: '2020-01-31T15:30:00.000Z',
        value_erred: false,
        percentile_5: '2.5',
        percentile_95: '0.209'
      },
      {
        rloi_id: 5069,
        telemetry_id: '694042',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Higham Avenue',
        external_name: 'Higham Avenue',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '0.533',
        value_timestamp: '2020-01-31T15:00:00.000Z',
        value_erred: false,
        percentile_5: '2.8',
        percentile_95: '0.24'
      },
      {
        rloi_id: 5085,
        telemetry_id: '694041',
        region: 'North West',
        catchment: 'Lower Mersey',
        wiski_river_name: 'Sankey Brook',
        agency_name: 'Liverpool Road',
        external_name: 'Liverpool Road',
        station_type: 'S',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '1.598',
        value_timestamp: '2020-01-31T15:00:00.000Z',
        value_erred: false,
        percentile_5: '3.8',
        percentile_95: '1.209'
      }
    ]

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
      url: '/river-and-sea-levels?q=Warrington&type=location'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('value="Warrington">')
    Code.expect(response.payload).to.contain('Fiddlers Ferry')
    Code.expect(response.payload).to.contain('Warrington latest river and sea levels - GOV.UK')
  })
})
