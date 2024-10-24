'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach } = exports.lab = Lab.script()
const { parse } = require('node-html-parser')
const proxyquire = require('proxyquire')

const { getWarning, getTargetArea, getTargetAreaThresholds } = require('../lib/helpers/data-builders')
const { linkChecker, headingChecker } = require('../lib/helpers/html-expectations')
const { validateFooterPresent } = require('../lib/helpers/context-footer-checker')

describe('target-area route', () => {
  let server

  async function setupFakeModel (values) {
    // Note: this is functionally the same as the class definition
    // class FakeViewModel {
    // -      constructor (options) {
    // -        Object.assign(this, {
    // -          ...values,
    // -          ...options
    // -        })
    // -      }
    // -    }
    // but using a function allows us to make it a spy to do later assertions on
    const FakeViewModel = sinon.spy(function (options) {
      Object.assign(this, {
        ...values,
        ...options
      })
    })

    const targetAreaRoute = proxyquire('../../server/routes/target-area', {
      '../../server/models/views/target-area': FakeViewModel
    })
    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(targetAreaRoute)
        }
      }
    }
    await server.register(targetAreaPlugin)
    return FakeViewModel
  }

  async function getResponse (areaCode) {
    const options = {
      method: 'GET',
      url: `/target-area/${areaCode}`
    }

    return await server.inject(options)
  }

  beforeEach(async () => {
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
    await server.initialize()

    const area = getTargetArea({ code: '011WAFDW' })
    const warning = getWarning({ ta_code: '011WAFDW' })
    const latestLevels = getTargetAreaThresholds([{ station_threshold_id: '1746074', station_id: '2138', fwis_code: '034FWFDEDERWATER', fwis_type: 'W', direction: 'u', value: '0.535', threshold_type: 'FW RES FW', river_id: 'river-derwent-derbyshire', river_name: 'River Derwent', river_qualified_name: 'River Derwent (Derbyshire)', navigable: true, view_rank: 1, rank: '5', rloi_id: 2138, up: 2103, down: 2130, telemetry_id: '4085', region: 'Midlands', catchment: 'Derbyshire Derwent', wiski_river_name: 'River Derwent', agency_name: 'Derby St Marys', external_name: 'Derby City', station_type: 'S', status: 'Active', qualifier: 'u', iswales: false, value_timestamp: '2024-08-08T17:45:00.000Z', value_erred: false, trend: 'steady', percentile_5: '1.85', percentile_95: '0.583', centroid: '0101000020E61000004B9C1B3B719BF7BFF845A5CDB0764A40', lon: -1.4754497822666675, lat: 52.92727060861574, day_total: null, six_hr_total: null, one_hr_total: null, id: '2114', threshold_value: '3.3', latest_level: '0.535' }])

    server.method('flood.getTargetAreaThresholds', sinon.stub().resolves(latestLevels))
    server.method('flood.getFloodArea', sinon.stub().resolves(area))
    server.method('flood.getFloods', sinon.stub().resolves({ floods: [warning] }))
  })

  it('should pass area and flood warning to view model constructor', async () => {
    const AREA_CODE = '011WAFDW'
    const latestLevel = 0.535
    const FakeViewModel = await setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water'
    })

    await getResponse(AREA_CODE)

    expect(FakeViewModel.calledOnce).to.be.true()
    expect(FakeViewModel.firstCall.args.length).to.equal(1)
    const argument = FakeViewModel.firstCall.args[0]
    expect(Object.keys(argument)).to.equal(['area', 'flood', 'parentFlood', 'thresholds'])
    // Note: the assertions are dependent on the values set up in beforeEach
    expect(argument.area.code).to.equal(AREA_CODE)
    expect(argument.flood.ta_code).to.equal(AREA_CODE)
    expect(argument.thresholds.latest_level).to.equal(latestLevel)
    expect(argument.parentFlood).to.be.undefined()
  })

  it('should display heading', async () => {
    const AREA_CODE = '011WAFDW'
    setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water'
    })

    const response = await getResponse(AREA_CODE)

    const root = parse(response.payload)
    headingChecker(root, 'h1', 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water')
  })
  it('should display related content links without sign up for flood warnings', async () => {
    const AREA_CODE = '011WAFDW'
    setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water',
      floodRiskUrl: 'https://fake-flood-risk-url.com',
      displayLongTermLink: true
    })

    const response = await getResponse(AREA_CODE)

    expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk', 'https://fake-flood-risk-url.com')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    validateFooterPresent(response)
  })
  it('should display river levels link', async () => {
    const AREA_CODE = '011WAFDW'
    setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water',
      targetArea: AREA_CODE
    })

    const response = await getResponse(undefined)

    expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    linkChecker(root.querySelectorAll('a'),
      'Find a river, sea, groundwater or rainfall level in this area',
      `/river-and-sea-levels/target-area/${AREA_CODE}`
    )
  })
  it('should return 404 if no code provided', async () => {
    setupFakeModel({})

    const options = {
      method: 'GET',
      url: '/target-area'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(404)
  })
  it('should display river levels link', async () => {
    const AREA_CODE = '011WAFDW'

    setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water',
      targetArea: AREA_CODE
    })

    const response = await getResponse(undefined)

    expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    linkChecker(root.querySelectorAll('a'),
      'Find a river, sea, groundwater or rainfall level in this area',
      `/river-and-sea-levels/target-area/${AREA_CODE}`
    )
  })
})
