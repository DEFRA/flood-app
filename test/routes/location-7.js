'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

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
})
