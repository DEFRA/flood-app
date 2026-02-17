'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { parse } = require('node-html-parser')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

const fakeTargetAreaFloodData = require('../data/fakeTargetAreaFloodData.json')

describe('Route - Target Area', () => {
  let sandbox
  let server

  beforeEach(async () => {
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

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  it('should 404 with no query parameters', async () => {
    const targetAreaPlugin = {
      plugin: {
        name: 'target-area',
        register: (server) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(targetAreaPlugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/target-area'
    }

    const response = await server.inject(options)
    const payload = JSON.parse(response.payload)

    expect(response.statusCode).to.equal(404)
    expect(payload.message).to.equal('Not Found')
  })

  it('should 200 and set the correct heading and links with target-area: "011WAFDW"', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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

    const root = parse(response.payload)

    const h1 = root.querySelector('h1').textContent.trim()

    const anchor = root.querySelectorAll('a').some(a =>
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )

    expect(response.statusCode).to.equal(200)
    expect(h1).to.equal('Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    expect(anchor).to.be.true()
  })

  it('should 200 with blank situation text', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      fakeTargetAreaFloodData.floods[0].situation = ''

      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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

    expect(response.statusCode).to.equal(200)
  })

  it('should 200 with unknown query parameter e.g. facebook click id', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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
      url: '/target-area/011WAFDW?q=000000000000000&fbclid=\'7890789078&*()&*)&)&*\''
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
  })

  it('should 200 and return flood severity banner "be prepared"', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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

    const bannerText = parse(response.payload).querySelector('.defra-flood-status-item__text .govuk-link').textContent

    expect(response.statusCode).to.equal(200)
    expect(bannerText).to.equal('be prepared')
  })

  it('should 200 and return flood severity banner "act now"', async () => {
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

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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
    const bannerText = parse(response.payload).querySelector('.defra-flood-status-item__text .govuk-link').textContent

    expect(response.statusCode).to.equal(200)
    expect(bannerText).to.equal('act now')
  })

  it('should 200 with no active flood alerts', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: []
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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

    const root = parse(response.payload)

    const h1 = root.querySelector('h1').textContent.trim()

    const anchor = root.querySelectorAll('a').some(a =>
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )

    expect(response.statusCode).to.equal(200)
    expect(h1).to.equal('Upper River Derwent, Stonethwaite Beck and Derwent Water flood alert area')
    expect(anchor).to.be.true()
  })

  it('should 200 with severe flood alerts active', async () => {
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

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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

    const root = parse(response.payload)

    const anchor = root.querySelectorAll('a').some(a =>
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('Severe flood warning for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    expect(anchor).to.be.true()
  })

  it('should return no floods alerts but a flood alert in the wider area message in banner', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.multiFloods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.floodsInWiderAreaPlace
    }

    const fakeTAThresholdsData = () => [{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }]

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)
    sandbox.stub(floodService, 'getTargetAreaThresholds').callsFake(fakeTAThresholdsData)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server) => {
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
      url: '/target-area/123FWF366'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload.replace(/\s+/g, ' ')).to.contain('There are no flood warnings in this area, but there is <a href="/target-area/123WAF984">a flood alert in the wider area</a>')
  })
})
