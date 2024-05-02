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

      expect(response.statusCode).to.equal(200)
      const root = parse(response.payload)
      const text = 'Talk to a Floodline adviser over webchat'
      const pFound = root.querySelectorAll('p.govuk-\\!-margin-bottom-0').some(p => p.text.trim().startsWith(text))
      expect(pFound, `p tag with text ${text} not found.`).to.be.true()
    })
    it('should not display webchat link', async () => {
      await server.register(
        proxyquire('../../server/plugins/views', {
          '../../server/config': { webchat: { enabled: false } }
        })
      )
      const response = await getResponse('011WAFDW')

      expect(response.statusCode).to.equal(200)
      const root = parse(response.payload)
      const text = 'Talk to a Floodline adviser over webchat'
      const pFound = root.querySelectorAll('p.govuk-\\!-margin-bottom-0').some(p => p.text.trim().startsWith(text))
      expect(pFound, `p tag with text ${text} found.`).to.be.false()
    })
  })
})
