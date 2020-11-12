'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')

lab.experiment('Routes test - location - 2', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]

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
  lab.test('GET /location with no query parameters', async () => {
    const locationPlugin = {
      plugin: {
        name: 'location',
        register: (server, options) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(locationPlugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/location'
    }
    const response = await server.inject(options)
    Code.expect(response.headers.location).to.equal('/find-location')
    Code.expect(response.payload).to.equal('')
  })
  lab.test('GET /location with query parameters giving undefined location', async () => {
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
        register: (server, options) => {
          server.route(require('../../server/routes/location'))
        }
      }
    }

    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/views'))
    await server.register(locationPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/location?q=xxxxxx'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('The service cannot find \'xxxxxx\'')
  })
  lab.test('GET /location with query parameters giving defined location', async () => {
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
  })
  lab.test('GET /location with query parameters with no flood service data', async () => {
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

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)

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

    Code.expect(response.payload).to.contain('There are no flood warnings or alerts in this area.')
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /location with no query', async () => {
    const fakeGetJson = () => {
      throw new Error('test error')
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
      url: '/location'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/find-location')
  })
  lab.test('GET /location with query parameters check for 1 alert 1 nlif', async () => {
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

    const fakeGetJson = () => data.warringtonGetJson

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

    Code.expect(response.payload).to.contain('Flooding is expected')
  })
  lab.test('GET /location with query parameters check for 1 alert 1 nlif', async () => {
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
      url: '/location?q=coxwold'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('GET /location with failing location services', async () => {
    const fakeGetJson = () => {
      throw new Error('test error')
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
      url: '/location?q=warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('Sorry, there is a problem with the service')
  })
  lab.test('GET /national view', async () => {
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

    floodService.floods = await floodService.getFloods()
    floodService.outlook = await floodService.getOutlook()

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
    await server.register(locationPlugin)
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
  lab.test('GET /location with query parameters check for no warnings', async () => {
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

    const fakeGetJson = () => data.warringtonGetJson

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
    Code.expect(response.payload).to.contain('There are no flood warnings or alerts in this area but some')
  })
  lab.test('GET /location with query parameters check for 1 alert 1 nlif', async () => {
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
    Code.expect(response.payload).to.contain('Some flooding is possible')
    Code.expect(response.payload).to.contain('There is a flood alert in this area')
    Code.expect(response.payload).to.contain('<a href="/target-area/053WAF117BED">1 flood alert or warning was removed </a> in the last 24 hours.')
  })
  lab.test('GET /location query not in England', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: false }
    }

    const fakeFloodsData = () => []
    const fakeStationsData = () => []
    const fakeImpactsData = () => []

    sandbox.stub(floodService, 'getIsEngland').callsFake(fakeIsEngland)
    sandbox.stub(floodService, 'getFloodsWithin').callsFake(fakeFloodsData)
    sandbox.stub(floodService, 'getStationsWithin').callsFake(fakeStationsData)
    sandbox.stub(floodService, 'getImpactsWithin').callsFake(fakeImpactsData)
    const fakeGetJson = () => data.scotlandGetJson

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
    Code.expect(response.payload).to.contain('The service cannot find')
  })
  lab.test('GET /location with query parameters for location-1sw-2w-1a', async () => {
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
    const fakeGetJson = () => data.warringtonGetJson

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
    Code.expect(response.payload).to.contain('There is a danger to life')
    Code.expect(response.payload).to.contain('Severe flood warning for ')
    Code.expect(response.payload).to.contain('2 flood warnings')
    Code.expect(response.payload).to.contain('1 flood alert')
  })
  lab.test('GET /location with query parameters check for 1 warning 2 alerts 2 nlif', async () => {
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
    Code.expect(response.payload).to.contain(' also in the wider area, where some flooding is possible.')
    Code.expect(response.payload).to.contain('Flood warning for')
    Code.expect(response.payload).to.contain('Flood alerts and warnings were removed')
    Code.expect(response.payload).to.contain('in the last 24 hours')
  })
  lab.test('GET /location with query parameters check for 2 severe warnings', async () => {
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
    Code.expect(response.payload).to.contain('2 severe flood warnings')
    Code.expect(response.payload).to.contain('There is a danger to life')
  })
  lab.test('GET /location with query parameters check for no warnings', async () => {
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
    Code.expect(response.payload).to.contain('There are no flood warnings or alerts in this area.')
  })
  lab.test('GET /location with query parameters check for no warnings', async () => {
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

    const fakeGetJson = () => data.warringtonGetJson

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
    Code.expect(response.payload).to.contain('There are no flood warnings or alerts in this area but some')
  })
})
