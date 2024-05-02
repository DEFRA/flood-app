'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach } = exports.lab = Lab.script()
const { parse } = require('node-html-parser')
const proxyquire = require('proxyquire')

const { getTargetArea } = require('../lib/helpers/data-builders')

describe('context-footer', () => {
  let server

  function statusCodeChecker (response, expectedStatusCode) {
    expect(response.statusCode, `Status code expectation failed (message: ${response.result?.message})`).to.equal(expectedStatusCode)
  }

  function webchatParagraphChecker (root, expectedFound) {
    const text = 'Talk to a Floodline adviser over webchat'
    const found = root.querySelectorAll('p.govuk-\\!-margin-bottom-0').some(p => p.text.trim().startsWith(text))
    expect(found, `find p tag with text ${text}.`).to.equal(expectedFound)
  }

  async function getResponse (areaCode) {
    const options = {
      method: 'GET',
      url: `/target-area/${areaCode}`
    }

    return await server.inject(options)
  }

  async function setupServer (plugins) {
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
    await server.register(plugins)
    await server.initialize()
  }

  beforeEach(async () => {
  })

  describe('target area page', () => {
    beforeEach(async () => {
      const FakeViewModel = sinon.spy(function (options) {
        Object.assign(this, {
          pageTitle: 'Page Title',
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
      await setupServer([
        targetAreaPlugin,
        proxyquire('../../server/plugins/session', {})
      ])
      const area = getTargetArea({ code: '011WAFDW' })

      server.method('flood.getFloodArea', sinon.stub().resolves(area))
      server.method('flood.getFloods', sinon.stub().resolves({ floods: [] }))
    })
    it('should display webchat link', async () => {
      await server.register(
        proxyquire('../../server/plugins/views', {
          '../../server/config': { webchat: { enabled: true } }
        })
      )
      const response = await getResponse('011WAFDW')

      statusCodeChecker(response, 200)
      const root = parse(response.payload)
      webchatParagraphChecker(root, true)
    })
    it('should not display webchat link', async () => {
      await server.register(
        proxyquire('../../server/plugins/views', {
          '../../server/config': { webchat: { enabled: false } }
        })
      )
      const response = await getResponse('011WAFDW')

      statusCodeChecker(response, 200)
      const root = parse(response.payload)
      webchatParagraphChecker(root, false)
    })
  })
  describe('location page', () => {
    beforeEach(async () => {
      const FakeViewModel = sinon.spy(function (options) {
        Object.assign(this, {
          pageTitle: 'Page Title',
          ...options
        })
      })
      const locationRoute = proxyquire('../../server/routes/location', {
        '../../server/models/views/location': FakeViewModel,
        '../../server/services/location': {
          find: sinon.stub().resolves([
            {
              name: 'Knaresborough, North Yorkshire',
              center: [-1.46303844, 54.00714111],
              bbox2k: [
                -1.534142855800849,
                53.972396744766755,
                -1.3874332865102472,
                54.05218516440792
              ],
              bbox10k: [
                -1.6566444925899468,
                53.90045113102211,
                -1.2649316497211494,
                54.12413077805586
              ],
              isUK: true,
              isScotlandOrNorthernIreland: false,
              isEngland: { is_england: true }
            }
          ])
        }
      })
      const locationPlugin = {
        plugin: {
          name: 'location',
          register: (server, options) => {
            server.route(locationRoute)
          }
        }
      }
      await setupServer([
        locationPlugin,
        proxyquire('../../server/plugins/session', {})
      ])
      server.method('flood.getImpactsWithin', sinon.stub().resolves([]))
      server.method('flood.getFloodsWithin', sinon.stub().resolves([]))
      server.method('flood.getStationsWithin', sinon.stub().resolves([]))
      server.method('flood.getOutlook', sinon.stub().resolves({}))
    })
    it('should display webchat link', async () => {
      await server.register(
        proxyquire('../../server/plugins/views', {
          '../../server/config': { webchat: { enabled: true } }
        })
      )
      const response = await server.inject({ method: 'GET', url: '/location/knaresborough-north-yorkshire' })

      statusCodeChecker(response, 200)
      const root = parse(response.payload)
      webchatParagraphChecker(root, true)
    })
    it('should not display webchat link', async () => {
      await server.register(
        proxyquire('../../server/plugins/views', {
          '../../server/config': { webchat: { enabled: false } }
        })
      )

      const response = await server.inject({ method: 'GET', url: '/location/knaresborough-north-yorkshire' })

      statusCodeChecker(response, 200)
      const root = parse(response.payload)
      webchatParagraphChecker(root, false)
    })
  })
})
