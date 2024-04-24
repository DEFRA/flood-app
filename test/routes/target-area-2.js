'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach } = exports.lab = Lab.script()
const { parse } = require('node-html-parser')
const proxyquire = require('proxyquire')

const { getWarning, getTargetArea } = require('../lib/helpers/data-builders')
const { linkChecker, headingChecker } = require('../lib/helpers/html-expectations')

describe('target-area route', () => {
  let server

  async function setupFakeModel (values) {
    class FakeViewModel {
      constructor (options) {
        Object.assign(this, {
          ...values,
          ...options
        })
      }
    }

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

    const area = getTargetArea({ code: 'ABCDW001' })
    const warning = getWarning({ ta_code: 'ABCDW001' })

    server.method('flood.getFloodArea', sinon.stub().resolves(area))
    server.method('flood.getFloods', sinon.stub().resolves({ floods: [warning] }))
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
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk', 'https://fake-flood-risk-url.com')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
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
      url: '/target-area/'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(404)
  })
})
