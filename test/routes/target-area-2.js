'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach } = exports.lab = Lab.script()
const { parse } = require('node-html-parser')
const proxyquire = require('proxyquire')

const { getWarning, getTargetArea } = require('../lib/helpers/data-builders')

describe('Route - Target Area 2', () => {
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
        register: (server) => {
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

    server.method('flood.getFloodArea', sinon.stub().resolves(area))
    server.method('flood.getFloods', sinon.stub().resolves({ floods: [warning] }))
  })

  it('should pass area and flood warning to view model constructor', async () => {
    const AREA_CODE = '011WAFDW'

    const FakeViewModel = await setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water'
    })

    await getResponse(AREA_CODE)

    expect(FakeViewModel.calledOnce).to.be.true()
    expect(FakeViewModel.firstCall.args.length).to.equal(1)

    const argument = FakeViewModel.firstCall.args[0]

    expect(Object.keys(argument)).to.equal(['area', 'flood', 'parentFlood'])

    expect(argument.area.code).to.equal(AREA_CODE)
    expect(argument.flood.ta_code).to.equal(AREA_CODE)
    expect(argument.parentFlood).to.be.undefined()
  })

  it('should set page title as H1', async () => {
    const AREA_CODE = '011WAFDW'

    setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water'
    })

    const response = await getResponse(AREA_CODE)

    const root = parse(response.payload)

    const h1 = root.querySelector('h1').textContent.trim()

    expect(h1).to.equal('Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water')
  })

  it('should display river levels link', async () => {
    const AREA_CODE = '011WAFDW'

    setupFakeModel({
      pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water',
      targetArea: AREA_CODE
    })

    const response = await getResponse(undefined)

    const root = parse(response.payload)

    const anchor = root.querySelectorAll('a').find(a => a.textContent.trim() === 'Find a river, sea, groundwater or rainfall level in this area')

    expect(response.statusCode).to.equal(200)
    expect(anchor.getAttribute('href')).to.equal(`/river-and-sea-levels/target-area/${AREA_CODE}`)
  })

  it('should 404 if no code provided', async () => {
    setupFakeModel({})

    const options = {
      method: 'GET',
      url: '/target-area/'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(404)
  })
})
