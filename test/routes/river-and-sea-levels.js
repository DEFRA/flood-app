'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const data = require('../data')
const { parse } = require('node-html-parser')
const { fullRelatedContentChecker } = require('../lib/helpers/html-expectations')

lab.experiment('Test - /river-and-sea-levels', () => {
  let sandbox
  let server
  let stubs

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/river-and-sea-levels.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]

    const floodService = require('../../server/services/flood')
    const util = require('../../server/util')

    sandbox = await sinon.createSandbox()
    stubs = {
      getJson: sandbox.stub(util, 'getJson'),
      getIsEngland: sandbox.stub(floodService, 'getIsEngland'),
      getStations: sandbox.stub(floodService, 'getStations'),
      getStationById: sandbox.stub(floodService, 'getStationById'),
      getStationsWithin: sandbox.stub(floodService, 'getStationsWithin'),
      getStationsByRadius: sandbox.stub(floodService, 'getStationsByRadius'),
      getStationsGeoJson: sandbox.stub(floodService, 'getStationsGeoJson'),
      getStationsWithinTargetArea: sandbox.stub(floodService, 'getStationsWithinTargetArea'),
      getRainfallStation: sandbox.stub(floodService, 'getRainfallStation'),
      getRiverById: sandbox.stub(floodService, 'getRiverById'),
      getRiversByName: sandbox.stub(floodService, 'getRiversByName'),
      getTargetArea: sandbox.stub(floodService, 'getTargetArea')
    }
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

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/logging'))
    require('../../server/services/server-methods')(server)
    await server.register({
      plugin: {
        name: 'warnings',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    })

    await server.initialize()
  })

  lab.afterEach(async () => {
    await sandbox.restore()
    await server.stop()
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/river-and-sea-levels.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]
  })

  lab.test('GET /river-and-sea-levels with legacy query parameter', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(301)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/warrington')
  })

  lab.test('GET /river-and-sea-levels with legacy query parameter invalid location', async () => {
    stubs.getJson.callsFake(() => data.nonLocationGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=not-found'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(404)
    Code.expect(response.headers.location).to.equal(undefined)
  })

  lab.test('GET /river-and-sea-levels with legacy query parameter postcode', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=WA4%201HT'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(301)
  })

  lab.test('GET /river-and-sea-levels with legacy query parameter england', async () => {
    stubs.getJson.callsFake(() => data.nonLocationGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=England'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
  })

  lab.test('GET /river-and-sea-levels with legacy query parameter valid non-england', async () => {
    stubs.getJson.callsFake(() => data.scotlandGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: false }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=kinghorn'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(301)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/kinghorn-fife')
  })

  lab.test('GET /river-and-sea-levels with legacy query parameter invalid characters', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=warrington%*_'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(301)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/warrington')
  })

  lab.test('GET /river-and-sea-levels/{location} with location', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])
    stubs.getStationsWithin.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('GET /river-and-sea-levels/{location} with invalid location', async () => {
    stubs.getJson.callsFake(() => data.nonLocationGetJson)

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/not-found'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(404)
  })

  lab.test('GET /river-and-sea-levels/{location} should set the canonical url', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/warrington?active=true'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('<link rel="canonical" href="http://localhost:3000/river-and-sea-levels/warrington"/>')
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('GET /river-and-sea-levels/{location} with england should redirect to default page', async () => {
    stubs.getJson.callsFake(() => data.nonLocationGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/england'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
  })

  lab.test('GET /river-and-sea-levels?q=warrington&riverId=123 should redirect with query parameters', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=warrington&riverId=123'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(301)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/warrington?riverId=123')
  })

  lab.test('GET /river-and-sea-levels empty query', async () => {
    stubs.getJson.callsFake(() => data.nonLocationGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])
    stubs.getStationsWithin.callsFake(() => [])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    const root = parse(response.payload)
    Code.expect(root.querySelectorAll('h2').some(h => h.textContent.trim().startsWith('No results for'))).to.be.false()
    Code.expect(root.querySelectorAll('table.defra-flood-levels-table#results').length).to.equal(0)
    Code.expect(response.payload).to.contain('Find river, sea, groundwater and rainfall levels - GOV.UK\n')
  })

  lab.test('GET /river-and-sea-levels only groundwater stations', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])
    stubs.getStationsWithin.callsFake(() => [
      {
        river_id: 'Groundwater Levels',
        river_name: 'Groundwater Levels',
        navigable: false,
        view_rank: 2,
        rank: null,
        rloi_id: 9306,
        up: null,
        down: null,
        telemetry_id: 'TQ35_42',
        region: 'Thames',
        catchment: 'London',
        wiski_river_name: 'Groundwater Level',
        agency_name: 'Woldingham Road',
        external_name: 'Woldingham Road',
        station_type: 'G',
        status: 'Active',
        qualifier: 'u',
        iswales: false,
        value: '77.15',
        value_timestamp: '2020-10-02T06:00:00.000Z',
        value_erred: false,
        percentile_5: '104.628',
        percentile_95: '70.609',
        centroid: '0101000020E6100000D5C8218D26B6AFBF8266C677D7A54940',
        lon: -0.061936573722862,
        lat: 51.2956380575897
      }
    ])

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=warrington&group=river" data-group-type="river">River (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=warrington&group=sea" data-group-type="sea">Sea (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=warrington&group=rainfall" data-group-type="rainfall">Rainfall (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=warrington&group=groundwater" data-group-type="groundwater">Groundwater (1)</a>')
  })

  lab.test('GET /river-and-sea-levels only rainfall stations', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])
    stubs.getStationsWithin.callsFake(() => ([
      {
        river_id: 'rainfall-Thames',
        river_name: 'Rainfall Thames',
        navigable: false,
        view_rank: 5,
        rank: null,
        rloi_id: null,
        up: null,
        down: null,
        telemetry_id: '253861TP',
        region: 'Thames',
        catchment: null,
        wiski_river_name: null,
        agency_name: 'Worsham',
        external_name: 'Worsham',
        station_type: 'R',
        status: 'Active',
        qualifier: null,
        iswales: false,
        value: 0,
        value_timestamp: '2021-05-28T10:00:00.000Z',
        value_erred: false,
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E610000029082C882404F9BF743F936BA6E54940',
        lon: -1.56351140205562,
        lat: 51.7941412419304,
        day_total: 0,
        six_hr_total: 0,
        one_hr_total: 0
      },
      {
        river_id: 'rainfall-Thames',
        river_name: 'Rainfall Thames',
        navigable: false,
        view_rank: 5,
        rank: null,
        rloi_id: null,
        up: null,
        down: null,
        telemetry_id: '265415TP',
        region: 'Thames',
        catchment: null,
        wiski_river_name: null,
        agency_name: 'Yattendon',
        external_name: 'Yattendon',
        station_type: 'R',
        status: 'Active',
        qualifier: null,
        iswales: false,
        value: 0,
        value_timestamp: '2021-05-28T10:30:00.000Z',
        value_erred: false,
        percentile_5: null,
        percentile_95: null,
        centroid: '0101000020E6100000ABC88FF60226F3BFDBF36C518BBB4940',
        lon: -1.19678016961238,
        lat: 51.4651891500468,
        day_total: 0,
        six_hr_total: 0,
        one_hr_total: 0
      }
    ]))

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/warrington'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=warrington&group=river" data-group-type="river">River (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=warrington&group=sea" data-group-type="sea">Sea (0)</a>')
    Code.expect(response.payload).to.contain('<a href="/river-and-sea-levels?q=warrington&group=rainfall" data-group-type="rainfall">Rainfall (2)</a>')
  })

  lab.test('GET /river-and-sea-levels Test funny latest value', async () => {
    // This test is off https://eaflood.atlassian.net/browse/FSR-354
    // stations values were being compared to percentile5 with out being cast to
    // a number and the string comparison is giving incorrect results
    // if the 2 numbers were of a different factor of 10
    // ie in this example '8.9' < '10.1' returns false
    // fix use parseFloat on each value to ensure it returns true.
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [])
    stubs.getStations.callsFake(() => [
      {
        river_id: 'sankey-brook',
        river_name: 'Sankey Brook',
        navigable: true,
        view_rank: 3,
        rank: 1,
        rloi_id: 5031,
        up: null,
        down: 5069,
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
        value: '8.9',
        value_timestamp: '2020-02-27T14:30:00.000Z',
        value_erred: false,
        percentile_5: '10.1',
        percentile_95: '0.209',
        centroid: '0101000020E610000095683DBA03FA04C089E4A73671B64A40',
        lon: -2.62207742214111,
        lat: 53.4253300018109
      }
    ])
    stubs.getJson.callsFake(() => {
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
        statusDescription: 'OK',
        traceId: 'trace-id'
      }
    })

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('GET /river-and-sea-levels?rainfall-id=E24195', async () => {
    stubs.getStationsByRadius.callsFake(() => data.stationsWithinRadiusRainfallid)
    stubs.getRainfallStation.callsFake(() => data.cachedRainfallStation)
    stubs.getStationsGeoJson.callsFake(() => data.cachedRainfallStation)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?rainfall-id=E24195'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/rainfall/E24195')
  })

  lab.test('GET /river-and-sea-levels/rainfall/E24195', async () => {
    stubs.getStationsByRadius.callsFake(() => data.stationsWithRadiusRainfallid)
    stubs.getRainfallStation.callsFake(() => data.cachedRainfallStation)
    stubs.getStationsGeoJson.callsFake(() => data.cachedRainfallStation)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/rainfall/E24195'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const headings = root.querySelectorAll('h1').some(h => h.textContent.trim() === 'Find river, sea, groundwater and rainfall levels')
    Code.expect(headings, 'Heading for levels found').to.be.true()
    const searchBoxValue = root.querySelectorAll('input.defra-search__input#location')[0].attributes.value
    Code.expect(searchBoxValue, 'Search box value').to.be.equal('')
    const paragraphs = root.querySelectorAll('p.govuk-body').some(p => p.textContent.trim() === 'Showing levels within 5 miles of EASTHAVEN BARRIER.')
    Code.expect(paragraphs, 'Distance message found').to.be.true()
  })

  lab.test('GET /river-and-sea-levels/rainfall/', async () => {
    stubs.getStationsByRadius.callsFake(() => data.stationsWithRadiusRainfallid)
    stubs.getRainfallStation.callsFake(() => data.cachedRainfallStation)
    stubs.getStationsGeoJson.callsFake(() => data.cachedRainfallStation)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/rainfall/'
    }

    const response = await server.inject(options)
    Code.expect(response.result.statusCode).to.equal(404)
    Code.expect(response.result.message).to.equal('Not Found')
  })

  lab.test('GET /river-and-sea-levels/rainfall/GKHLETOY', async () => {
    stubs.getStationsByRadius.callsFake(() => data.stationsWithinRadius)
    stubs.getRainfallStation.callsFake(() => data.rainfallStation.find(function (rainfallStation) {
      return rainfallStation.station_reference === 'GKHLETOY'
    }))
    stubs.getStationsGeoJson.callsFake(() => data.cachedRainfallStation)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/rainfall/GKHLETOY'
    }

    const response = await server.inject(options)

    Code.expect(response.result.statusCode).to.equal(404)
    Code.expect(response.result.message).to.equal('Rainfall Gauge "GKHLETOY" not found')
  })

  lab.test('GET /river-and-sea-levels?target-area=011FWFNC6KC should redirect', async () => {
    stubs.getStationsWithinTargetArea.callsFake(() => data.stationsWithinTa)
    stubs.getTargetArea.callsFake(() => data.getTA)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?target-area=011FWFNC6KC'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/target-area/011FWFNC6KC')
  })

  lab.test('GET /river-and-sea-levels/target-area/011FWFNC6KC', async () => {
    stubs.getStationsWithinTargetArea.callsFake(() => data.stationsWithinTa)
    stubs.getTargetArea.callsFake(() => data.getTA)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels/target-area/011FWFNC6KC'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('River (8)')
    Code.expect(response.payload).to.contain('Showing levels within 5 miles of Keswick Campsite.')
  })

  lab.test('GET /river-and-sea-levels?q=tyne returns river list', async () => {
    stubs.getJson.callsFake(() => {
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
        statusDescription: 'OK',
        traceId: 'trace-id'
      }
    })
    stubs.getStations.callsFake(() => [])
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [
      {
        name: 'River North Tyne',
        qualified_name: 'River North Tyne',
        id: 'river-north-tyne'
      },
      {
        name: 'River South Tyne',
        qualified_name: 'River South Tyne',
        id: 'river-south-tyne'
      },
      {
        name: 'River Tyne',
        qualified_name: 'River Tyne',
        id: 'river-tyne'
      }
    ])
    stubs.getStationsGeoJson.callsFake(() => data.cachedRainfallStation)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=tyne'
    }

    const response = await server.inject(options)

    Code.expect(response.payload).to.contain('Tyne')
    Code.expect(response.payload).to.contain('<mark>Tyne</mark>')
    Code.expect(response.payload).to.contain('Rivers')
    Code.expect(response.payload).to.contain('More than one match was found for your location.')
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('GET /river-and-sea-levels?q=avon returns multiple choice page', async () => {
    stubs.getJson.callsFake(() => data.avonGetJson)
    stubs.getStationsWithin.callsFake(() => [{
      river_id: 'river-alne',
      river_name: 'River Alne',
      river_qualified_name: 'River Alne',
      navigable: true,
      view_rank: 1,
      rank: '1',
      rloi_id: 2083,
      up: null,
      down: 2048,
      telemetry_id: '2621',
      region: 'Midlands',
      catchment: 'Warwickshire Avon',
      wiski_river_name: 'River Alne',
      agency_name: 'Henley River',
      external_name: 'Henley River',
      station_type: 'S',
      status: 'Active',
      qualifier: 'u',
      iswales: false,
      value: '0.414',
      value_timestamp: '2022-09-26T13:30:00.000Z',
      value_erred: false,
      percentile_5: '0.546',
      percentile_95: '0.387',
      centroid: '0101000020E6100000068A4FA62670FCBF9C9AE66602264A40',
      lon: -1.77738060917966,
      lat: 52.29694830188711,
      day_total: null,
      six_hr_total: null,
      one_hr_total: null,
      id: '610'
    }])
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [
      {
        local_name: 'Little Avon River',
        qualified_name: 'Little Avon River',
        other_names: null,
        river_id: 'little-avon-river'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Bristol)',
        other_names: null,
        river_id: 'river-avon-bristol'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Corsham)',
        other_names: null,
        river_id: 'river-avon-corsham'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Devon)',
        other_names: null,
        river_id: 'river-avon-devon'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Hampshire)',
        other_names: null,
        river_id: 'river-avon-hampshire'
      },
      {
        local_name: 'River Avon',
        qualified_name: 'River Avon (Warwickshire)',
        other_names: null,
        river_id: 'river-avon-warwickshire'
      },
      {
        local_name: 'Sherston Avon',
        qualified_name: 'Sherston Avon',
        other_names: null,
        river_id: 'sherston-avon'
      },
      {
        local_name: 'Tetbury Avon',
        qualified_name: 'Tetbury Avon',
        other_names: null,
        river_id: 'tetbury-avon'
      }
    ])
    stubs.getStationsGeoJson.callsFake(() => data.cachedRainfallStation)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=avon'
    }

    const response = await server.inject(options)

    const root = parse(response.payload)

    const metaDescription = root
      .querySelectorAll('[name="description"]')

    Code.expect(metaDescription[0]._attrs.content).to.equal('Find river, sea, groundwater and rainfall levels in England. Check the last updated height, trend and state recorded by the measuring station.')
    Code.expect(response.payload).to.contain('avon - Find river, sea, groundwater and rainfall levels - GOV.UK')
    Code.expect(response.payload).to.contain('Levels near')
    Code.expect(response.payload).to.contain('Rivers')
    Code.expect(response.payload).to.contain('More than one match was found for your location.')
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('GET /river-and-sea-levels?q=river mersey returns the river stations', async () => {
    stubs.getJson.callsFake(() => {
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
        statusDescription: 'OK',
        traceId: 'trace-id'
      }
    })
    stubs.getStationsWithin.callsFake(() => [{
      river_id: 'river-alne',
      river_name: 'River Alne',
      navigable: true,
      view_rank: 1,
      rank: '1',
      rloi_id: 2083,
      up: null,
      down: 2048,
      telemetry_id: '2621',
      region: 'Midlands',
      catchment: 'Warwickshire Avon',
      wiski_river_name: 'River Alne',
      agency_name: 'Henley River',
      external_name: 'Henley River',
      station_type: 'S',
      status: 'Active',
      qualifier: 'u',
      iswales: false,
      value: '0.414',
      value_timestamp: '2022-09-26T13:30:00.000Z',
      value_erred: false,
      percentile_5: '0.546',
      percentile_95: '0.387',
      centroid: '0101000020E6100000068A4FA62670FCBF9C9AE66602264A40',
      lon: -1.77738060917966,
      lat: 52.29694830188711,
      day_total: null,
      six_hr_total: null,
      one_hr_total: null,
      id: '610'
    }])
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))
    stubs.getRiversByName.callsFake(() => [
      {
        name: 'River Mersey',
        qualified_name: 'River Mersey',
        id: 'river-mersey'
      }
    ])
    stubs.getStationsGeoJson.callsFake(() => data.cachedRainfallStation)

    // Set cached stationsGeojson
    const floodService = require('../../server/services/flood')
    floodService.stationsGeojson = await floodService.getStationsGeoJson()

    const options = {
      method: 'GET',
      url: '/river-and-sea-levels?q=river%20mersey'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/river/river-mersey')
  })

  lab.test('POST /river-and-sea-levels empty query should return start page', async () => {
    stubs.getStations.callsFake(() => [])
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))

    const options = {
      method: 'POST',
      url: '/river-and-sea-levels'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.payload).to.not.contain('No results for')
  })

  lab.test('POST /river-and-sea-levels empty space query should return start page', async () => {
    stubs.getStations.callsFake(() => [])
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))

    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: { location: '  ' }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.not.contain('No results for')
  })

  lab.test('POST /river-and-sea-levels non empty query should redirect', async () => {
    stubs.getJson.callsFake(() => data.warringtonGetJson)
    stubs.getStations.callsFake(() => [])
    stubs.getRiversByName.callsFake(() => [])
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))

    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: { location: 'warrington' }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(301)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels/warrington')

    // const root = parse(response.payload)
    // Code.expect(root.querySelectorAll('h2').some(h => h.textContent.trim().startsWith('No results for'))).to.be.false()
    // Code.expect(root.querySelectorAll('table.defra-flood-levels-table#results').length).to.equal(0)
  })

  lab.test('POST /river-and-sea-levels with location england should show location not found', async () => {
    stubs.getJson.callsFake(() => data.nonLocationGetJson)
    stubs.getStations.callsFake(() => [])
    stubs.getRiversByName.callsFake(() => [])
    stubs.getIsEngland.callsFake(() => ({ is_england: true }))

    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: {
        location: 'england'
      }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
  })

  lab.experiment('RLOI', () => {
    lab.test('GET /river-and-sea-levels?rloi-id=7224 should redirect', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getStationsByRadius.callsFake(() => data.stationsWithinRadius)
      stubs.getStationById.callsFake(() => data.riverStation7224)
      stubs.getStationsGeoJson.callsFake(() => data.cachedStation)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))

      // Set cached stationsGeojson
      const floodService = require('../../server/services/flood')
      floodService.stationsGeojson = await floodService.getStationsGeoJson()

      const options = {
        method: 'GET',
        url: '/river-and-sea-levels?rloi-id=7224'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(302)
      Code.expect(response.headers.location).to.equal('/river-and-sea-levels/rloi/7224')
    })

    lab.test('GET /river-and-sea-levels/rloi/7224', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getStationsByRadius.callsFake(() => data.stationsWithinRadius)
      stubs.getStationById.callsFake(() => data.riverStation7224)
      stubs.getStationsGeoJson.callsFake(() => data.cachedStation)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))

      // Set cached stationsGeojson
      const floodService = require('../../server/services/flood')
      floodService.stationsGeojson = await floodService.getStationsGeoJson()

      const options = {
        method: 'GET',
        url: '/river-and-sea-levels/rloi/7224'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      Code.expect(response.payload).to.contain('River (9)')
      Code.expect(response.payload).to.contain('Grants Bridge')
      Code.expect(response.payload).to.contain('Showing levels within 5 miles of Grants Bridge.')
    })
  })

  lab.experiment('River', () => {
    lab.test('GET /river-and-sea-levels?river-id=river-nidd should redirect', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getStationsByRadius.callsFake(() => data.stationsWithinRadius)
      stubs.getStationById.callsFake(() => data.riverStation7224)
      stubs.getStationsGeoJson.callsFake(() => data.cachedStation)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))

      // Set cached stationsGeojson
      const floodService = require('../../server/services/flood')
      floodService.stationsGeojson = await floodService.getStationsGeoJson()

      const options = {
        method: 'GET',
        url: '/river-and-sea-levels?riverId=river-nidd'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(302)
      Code.expect(response.headers.location).to.equal('/river-and-sea-levels/river/river-nidd')
    })

    lab.test('GET /river-and-sea-levels/river/river-nidd', async () => {
      stubs.getRiverById.callsFake(() => data.riverNiddStations)

      const options = {
        method: 'GET',
        url: '/river-and-sea-levels/river/river-nidd'
      }

      const response = await server.inject(options)

      Code.expect(response.statusCode).to.equal(200)
      const root = parse(response.payload)
      const searchBoxValue = root.querySelectorAll('input.defra-search__input#location')[0].attributes.value
      Code.expect(searchBoxValue, 'Search box value').to.be.equal('River Nidd')
      const riversTab = root.querySelectorAll('ul#filter.defra-navbar__list li.defra-navbar__item--selected')[0].text.trim()
      Code.expect(riversTab).to.be.equal('River (6)')
    })

    lab.test('GET /river-and-sea-levels - Check for related content links', async () => {
      stubs.getStations.callsFake(() => [])
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))

      const options = {
        method: 'GET',
        url: '/river-and-sea-levels'
      }

      const response = await server.inject(options)
      Code.expect(response.statusCode).to.equal(200)

      const root = parse(response.payload)
      Code.expect(root.querySelectorAll('h2').some(h => h.textContent.trim().startsWith('No results for'))).to.be.false()
      fullRelatedContentChecker(root)
    })
  })
})
