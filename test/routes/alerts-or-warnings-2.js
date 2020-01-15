'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Test - alerts - warnings', () => {
  let sandbox
  let server

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/routes/location.js')]
    delete require.cache[require.resolve('../../server/routes/warnings.js')]
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

  lab.test('GET /alerts-and-warnings with query parameters, show alert, warnings and severe', async () => {
    const floodService = require('../../server/services/flood')

    const fakeIsEngland = () => {
      return { is_england: true }
    }
    // const fakePlaceData = () => {}
    const fakeFloodsData = () => {
      return {
        floods: [
          {
            code: '013FWFCH29',
            key: 4558714,
            description: 'Wider area at risk from Sankey Brook at Dallam',
            quickdialnumber: '305027',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity: 2,
            severitydescription: 'Flood Warning',
            warningkey: 1,
            raised: '2020-01-08T13:09:09.628Z',
            severitychanged: '2020-01-08T13:09:09.628Z',
            messagechanged: '2020-01-08T13:09:09.628Z',
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
            '\n' +
            'Quisque nec ultrices risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque viverra, tortor sit amet condimentum laoreet, lorem ante dictum ante, nec hendrerit nisl lacus sit amet diam. Praesent ut ornare lorem. Quisque placerat sollicitudin enim, sit amet laoreet enim consectetur in. Praesent nec nunc a ligula cursus cursus.\n' +
            '\n' +
            'Proin a dictum mauris, eget pulvinar augue. Pellentesque non lectus nibh. Pellentesque convallis ultricies enim, vel lacinia metus rhoncus vitae. Donec at porta tellus. In hac habitasse platea dictumst. Vestibulum mollis mollis nibh, sit amet maximus sem suscipit eu. Etiam elementum sed nulla quis tincidunt.'
          },
          {
            code: '013WAFLM',
            key: 4558677,
            description: 'Lower River Mersey including Warrington, Runcorn and Lymm areas',
            quickdialnumber: '143117',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity: 4,
            severitydescription: 'No longer in force',
            warningkey: 1,
            raised: '2020-01-08T13:09:09.599Z',
            severitychanged: '2020-01-08T13:09:09.599Z',
            messagechanged: '2020-01-08T13:09:09.599Z',
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
            '\n' +
            'Quisque nec ultrices risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque viverra, tortor sit amet condimentum laoreet, lorem ante dictum ante, nec hendrerit nisl lacus sit amet diam. Praesent ut ornare lorem. Quisque placerat sollicitudin enim, sit amet laoreet enim consectetur in. Praesent nec nunc a ligula cursus cursus.\n' +
            '\n' +
            'Proin a dictum mauris, eget pulvinar augue. Pellentesque non lectus nibh. Pellentesque convallis ultricies enim, vel lacinia metus rhoncus vitae. Donec at porta tellus. In hac habitasse platea dictumst. Vestibulum mollis mollis nibh, sit amet maximus sem suscipit eu. Etiam elementum sed nulla quis tincidunt.'
          },
          {
            code: '013WATMEW',
            key: 4558681,
            description: 'Mersey Estuary at Warrington',
            quickdialnumber: '205003',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity: 3,
            severitydescription: 'Flood Alert',
            warningkey: 1,
            raised: '2020-01-08T13:09:09.599Z',
            severitychanged: '2020-01-08T13:09:09.599Z',
            messagechanged: '2020-01-08T13:09:09.599Z',
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
            '\n' +
            'Quisque nec ultrices risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque viverra, tortor sit amet condimentum laoreet, lorem ante dictum ante, nec hendrerit nisl lacus sit amet diam. Praesent ut ornare lorem. Quisque placerat sollicitudin enim, sit amet laoreet enim consectetur in. Praesent nec nunc a ligula cursus cursus.\n' +
            '\n' +
            'Proin a dictum mauris, eget pulvinar augue. Pellentesque non lectus nibh. Pellentesque convallis ultricies enim, vel lacinia metus rhoncus vitae. Donec at porta tellus. In hac habitasse platea dictumst. Vestibulum mollis mollis nibh, sit amet maximus sem suscipit eu. Etiam elementum sed nulla quis tincidunt.'
          },
          {
            code: '013WAFDI',
            key: 4558688,
            description: 'River Ditton catchment including areas around Huyton-with-Roby and Widnes',
            quickdialnumber: '143114',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity: 1,
            severitydescription: 'Flood Alert',
            warningkey: 1,
            raised: '2020-01-08T13:09:09.599Z',
            severitychanged: '2020-01-08T13:09:09.599Z',
            messagechanged: '2020-01-08T13:09:09.599Z',
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
            '\n' +
            'Quisque nec ultrices risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque viverra, tortor sit amet condimentum laoreet, lorem ante dictum ante, nec hendrerit nisl lacus sit amet diam. Praesent ut ornare lorem. Quisque placerat sollicitudin enim, sit amet laoreet enim consectetur in. Praesent nec nunc a ligula cursus cursus.\n' +
            '\n' +
            'Proin a dictum mauris, eget pulvinar augue. Pellentesque non lectus nibh. Pellentesque convallis ultricies enim, vel lacinia metus rhoncus vitae. Donec at porta tellus. In hac habitasse platea dictumst. Vestibulum mollis mollis nibh, sit amet maximus sem suscipit eu. Etiam elementum sed nulla quis tincidunt.'
          },
          {
            code: '013WAFGL',
            key: 4558685,
            description: 'River Glaze catchment including Leigh and East Wigan',
            quickdialnumber: '143115',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity: 3,
            severitydescription: 'Flood Alert',
            warningkey: 1,
            raised: '2020-01-08T13:09:09.599Z',
            severitychanged: '2020-01-08T13:09:09.599Z',
            messagechanged: '2020-01-08T13:09:09.599Z',
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
            '\n' +
            'Quisque nec ultrices risus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque viverra, tortor sit amet condimentum laoreet, lorem ante dictum ante, nec hendrerit nisl lacus sit amet diam. Praesent ut ornare lorem. Quisque placerat sollicitudin enim, sit amet laoreet enim consectetur in. Praesent nec nunc a ligula cursus cursus.\n' +
            '\n' +
            'Proin a dictum mauris, eget pulvinar augue. Pellentesque non lectus nibh. Pellentesque convallis ultricies enim, vel lacinia metus rhoncus vitae. Donec at porta tellus. In hac habitasse platea dictumst. Vestibulum mollis mollis nibh, sit amet maximus sem suscipit eu. Etiam elementum sed nulla quis tincidunt.'
          },
          {
            code: '013WAFSA',
            key: 4558689,
            description: 'River Sankey catchment with St Helens and Warrington',
            quickdialnumber: '143122',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity: 3,
            severitydescription: 'Flood Alert',
            warningkey: 1,
            raised: '2020-01-08T13:09:09.599Z',
            severitychanged: '2020-01-08T13:09:09.599Z',
            messagechanged: '2020-01-08T13:09:09.599Z',
            message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam ex sapien, luctus quis neque sit amet, rutrum semper odio. Mauris metus elit, semper in libero sed, vulputate placerat ante. In bibendum in libero in placerat. Aenean et ante nulla. Nullam tempus leo vitae mattis aliquam. Etiam tempus dignissim efficitur. Nam luctus tempus risus sit amet porttitor. Integer quis dapibus arcu, eu eleifend arcu. Vestibulum non nunc elit. Donec facilisis lorem tristique ultricies dapibus. Sed eleifend sit amet nibh ut tincidunt.\n' +
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

    const warningsPlugin = {
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/warnings'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(warningsPlugin)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/alerts-and-warnings?q=Warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('6 results')
    Code.expect(response.payload).to.contain('1 flood warning')
    Code.expect(response.payload).to.contain('1 severe flood warning')
    Code.expect(response.payload).to.contain('3 flood alerts')
    Code.expect(response.payload).to.contain('1 flood warning removed')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFGL">River Glaze catchment including Leigh and East Wigan</a>')
    Code.expect(response.payload).to.contain('<a href="/target-area/013FWFCH29">Wider area at risk from Sankey Brook at Dallam</a>')
    Code.expect(response.payload).to.contain('<a href="/target-area/013WAFDI">River Ditton catchment including areas around Huyton-with-Roby and Widnes</a>')
    Code.expect(response.statusCode).to.equal(200)
  })
})
