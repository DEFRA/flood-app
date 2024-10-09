'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const moment = require('moment-timezone')
const lab = exports.lab = Lab.script()
const { parse } = require('node-html-parser')
const fakeTargetAreaFloodData = require('../data/fakeTargetAreaFloodData.json')
const fakeTaThresholds = require('../data/taThresholdsData.json')
const { linkChecker } = require('../lib/helpers/html-expectations')
const { validateFooterPresent } = require('../lib/helpers/context-footer-checker')

lab.experiment('Target-area tests', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/target-area.js')]

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

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('GET target-area with unknown parameter e.g. facebook click id', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: []
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW?q=000000000000000&fbclid=\'7890789078&*()&*)&)&*\''
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
  })
  lab.test('Check flood severity banner link for Flood alert', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const fixedTime = moment.tz('2024-08-08T18:15:00.000Z', 'Europe/London')
    const clock = sinon.useFakeTimers(fixedTime.valueOf())

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    // Latest level (single threshold)
    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest level</h2>')
    Code.expect(response.payload).to.contain('<p>The River Derwent level at Derby St Marys was 0.54 metres. Property flooding is possible when it goes above 3.30 metres.')
    Code.expect(response.payload).to.contain('<a href="/station/2138?tid=1746074">Monitor the latest level at Derby St Marys</a>')
    Code.expect(response.payload).to.match(/<div class="defra-flood-status-item__text">\s*<strong>Flooding is possible - <a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do#flood-alert">\s*be prepared\s*<\/a><\/strong>\s*<\/div>/)
    Code.expect(response.payload).to.contain('<p class="defra-flood-meta defra-flood-meta--no-border govuk-!-margin-bottom-0"><strong>30 minutes ago</strong></p>')

    clock.restore()
  })
  lab.test('Check flood severity banner link for Flood warning and multi latest levels', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      fakeTargetAreaFloodData.floods[0].severity_value = 2
      fakeTargetAreaFloodData.floods[0].severity = 'Flood warning'

      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.multipleLatestLevels

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.match(/<div class="defra-flood-status-item__text">\s*<strong>Flooding is expected - <a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do#flood-warning">\s*act now\s*<\/a><\/strong>\s*<\/div>/)

    // latests levels (multi)
    // console.log('DEFRA Live Elements:', response.payload.match(/<div class="defra-live[^>]*>[\s\S]*?<\/div>/g)) // Keep for debugging
    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest levels</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Eastcote Road was 0.35 metres. Property flooding is possible when it goes above 1.40 metres.')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Avenue Road was 0.18 metres. Property flooding is possible when it goes above 1.46 metres.')
    Code.expect(response.payload).to.contain('<a href="/station/7173?tid=1747543">Monitor the River Pinn level at Avenue Road</a>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Moss Close was 0.13 metres. Property flooding is possible when it goes above 1.15 metres.')
    Code.expect(response.payload).to.contain('<a href="/station/7201?tid=1747541">Monitor the River Pinn level at Moss Close</a>')
  })
  lab.test('Check flood severity banner link for Flood warning', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      fakeTargetAreaFloodData.floods[0].severity_value = 3
      fakeTargetAreaFloodData.floods[0].severity = 'Severe flood warning'

      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.match(/<div class="defra-flood-status-item__text">\s*<strong>Danger to life - <a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do#severe-flood-warning">\s*act now\s*<\/a><\/strong>\s*<\/div>/)
  })
  lab.test('GET target-area 011WAFDW with no flood alerts active', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: []
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    Code.expect(response.payload).to.contain('Find a river, sea, groundwater or rainfall level in this area')
    Code.expect(response.payload).to.contain('<a data-journey-click="Target Area:Station list:TA - View station list" href="/river-and-sea-levels/target-area/011WAFDW">')

    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    Code.expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    // context footer check
    validateFooterPresent(response)

    const h1Found = root.querySelectorAll('h1').some(h => h.textContent.trim() === 'Upper River Derwent, Stonethwaite Beck and Derwent Water flood alert area')
    Code.expect(h1Found, 'Heading for target area found').to.be.true()
  })
  lab.test('GET target-area 011WAFDW with severe flood alerts active', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.severeFlood
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    Code.expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    // context footer check
    validateFooterPresent(response)
    Code.expect(response.payload).to.contain('Severe flood warning for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    Code.expect(response.payload).to.contain('Find a river, sea, groundwater or rainfall level in this area')

    const anchorFound = root.querySelectorAll('a').some(a =>
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )
    Code.expect(anchorFound, 'Link to levels in the area found').to.be.true()
  })
  lab.test('No floods alerts but a flood alert in the wider area message in banner', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.multiFloods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.floodsInWiderAreaPlace
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/123FWF366'
    }

    const response = await server.inject(options)

    Code.expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    Code.expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    // context footer check
    validateFooterPresent(response)
    Code.expect(response.payload).to.contain('There are no flood warnings in this area, but there is <a href="/target-area/123WAF984">a flood alert in the wider area</a>')
  })

  lab.test('Should not display latest level, TA has non in DB', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeTAThresholdsData = () => []

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.not.contain('<h2 class="defra-live__title">Latest level</h2>')
  })

  lab.test('Should not display latest levels as more than four', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      fakeTargetAreaFloodData.floods[0].severity_value = 2
      fakeTargetAreaFloodData.floods[0].severity = 'Flood warning'

      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.overLimitLatestLevels

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.match(/<div class="defra-flood-status-item__text">\s*<strong>Flooding is expected - <a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do#flood-warning">\s*act now\s*<\/a><\/strong>\s*<\/div>/)

    // latests levels (multi)
    Code.expect(response.payload).to.not.contain('<h2 class="defra-live__title">Latest levels</h2>')
  })

  lab.test('Displays latest level for a single active but offline station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.singleActiveOffline

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest level</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Avenue Road is currently unavailable.</p>')
    Code.expect(response.payload).to.contain('<p class="defra-live__supplementary">This level will update automatically</p>')
  })

  lab.test('Displays latest level for a single suspended station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.singleSuspended

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest level</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Moss Close is currently unavailable.</p>')
    Code.expect(response.payload).to.contain('<p class="defra-live__supplementary">This level will update automatically</p>')
  })

  lab.test('Displays multiple levels with one active but offline, one normal, and one Welsh station with no values', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.multipleNormalActiveOfflineWelshNoValues

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest levels</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Eastcote Road was 0.35 metres. Property flooding is possible when it goes above 1.40 metres.')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Avenue Road is currently unavailable.</p>')
  })

  lab.test('Displays multiple levels with one suspended, one normal, and one closed', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.multipleNormalSuspendedClosed

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest levels</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Eastcote Road was 0.35 metres. Property flooding is possible when it goes above 1.40 metres.')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Avenue Road is currently unavailable.</p>')
    Code.expect(response.payload).to.contain('<p class="defra-live__supplementary">These levels will update automatically</p>')
  })

  lab.test('Displays multiple levels with one Closed and one normal station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.multipleNormalClosed

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest level</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Eastcote Road was 0.35 metres. Property flooding is possible when it goes above 1.40 metres.')
    Code.expect(response.payload).to.contain('<p class="defra-live__supplementary">This level will update automatically</p>')
  })

  lab.test('Displays multiple levels with one normal, one active but offline, and one Welsh station with no values', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.multipleNormalActiveOfflineWelshNoValues

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest levels</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Eastcote Road was 0.35 metres. Property flooding is possible when it goes above 1.40 metres.')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Avenue Road is currently unavailable.</p>')
    Code.expect(response.payload).to.not.contain('<p>The River Welsh station level is currently unavailable.</p>')
    Code.expect(response.payload).to.contain('<p class="defra-live__supplementary">These levels will update automatically</p>')
  })

  lab.test('Displays multiple levels with one normal, one suspended, and one Closed station', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.multipleNormalSuspendedClosed

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest levels</h2>')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Eastcote Road was 0.35 metres. Property flooding is possible when it goes above 1.40 metres.')
    Code.expect(response.payload).to.contain('<p>The River Pinn level at Avenue Road is currently unavailable.</p>')
    Code.expect(response.payload).to.not.contain('<p>The River Test level at Test Road is currently unavailable.</p>')
    Code.expect(response.payload).to.contain('<p class="defra-live__supplementary">These levels will update automatically</p>')
  })

  lab.test('Does not display levels if all stations are Closed or Welsh with no values', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.allClosedOrWelshNoValues

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.not.contain('<h2 class="defra-live__title">Latest levels</h2>')
  })

  lab.test('Displays Welsh station with values', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => fakeTaThresholds.singleWelshWithValues

    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)

    Code.expect(response.payload).to.contain('<h2 class="defra-live__title">Latest level</h2>')
    Code.expect(response.payload).to.contain('<p>The River Welsh level at Welsh Station was 0.35 metres. Property flooding is possible when it goes above 1.40 metres.\n        \n      </p>')
    Code.expect(response.payload).to.contain('<a href="/station/7201">Monitor the latest level at Welsh Station (Natural Resources Wales)</a>')
    Code.expect(response.payload).to.contain('<p class="defra-live__supplementary">This level will update automatically</p>')
  })
})
