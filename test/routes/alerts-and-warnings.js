'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const data = require('../data')
const outlookData = require('../data/outlook.json')

describe('Route - Alerts and Warnings', () => {
  let server
  let sandbox
  let stubs

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]

    const floodService = require('../../server/services/flood')
    const util = require('../../server/util')

    sandbox = await sinon.createSandbox()

    stubs = {
      getJson: sandbox.stub(util, 'getJson'),
      getIsEngland: sandbox.stub(floodService, 'getIsEngland'),
      getFloods: sandbox.stub(floodService, 'getFloods'),
      getFloodsWithin: sandbox.stub(floodService, 'getFloodsWithin'),
      getStationsWithin: sandbox.stub(floodService, 'getStationsWithin'),
      getImpactsWithin: sandbox.stub(floodService, 'getImpactsWithin'),
      getStationById: sandbox.stub(floodService, 'getStationById'),
      getOutlook: sandbox.stub(floodService, 'getOutlook'),
      getWarningsAlertsWithinStationBuffer: sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer')
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
        register: (server) => {
          server.route(require('../../server/routes/alerts-and-warnings'))
        }
      }
    })

    await server.initialize()
  })

  afterEach(async () => {
    await sandbox.restore()
    await server.stop()
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]
  })

  describe('GET', () => {
    it('should redirect with legacy query parameter', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getFloodsWithin.callsFake(() => ({ floods: [] }))
      stubs.getStationsWithin.callsFake(() => [])
      stubs.getImpactsWithin.callsFake(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/alerts-and-warnings/warrington')
    })

    it('should 404 with legacy query parameter invalid location', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=not-found'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
      expect(response.headers.location).to.equal(undefined)
    })

    it('should 301 redirect with legacy query parameter: postcode', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getFloodsWithin.callsFake(() => data.floodsByPostCode)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=WA4%201HT'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(301)
    })

    it('should 302 with legacy query parameter: "england"', async () => {
      stubs.getFloods.callsFake(() => ({
        floods: [
          {
            ta_code: '013FWFCH29',
            id: 4558714,
            ta_name: 'Wider area at risk from Sankey Brook at Dallam',
            quick_dial: '305027',
            region: 'Midlands',
            area: 'Central',
            floodtype: 'f',
            severity_value: 2,
            severitydescription: 'Flood Warning',
            warningkey: 1,
            message_received: '2020-01-08T13:09:09.628Z',
            severity_changed: '2020-01-08T13:09:09.628Z',
            situation_changed: '2020-01-08T13:09:09.628Z',
            situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elits nibh.'
          }
        ]
      }))
      stubs.getOutlook.callsFake(() => outlookData.statements[0])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=England'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('/alerts-and-warnings')
    })

    it('should 404 with legacy query parameter: valid non-england location', async () => {
      stubs.getIsEngland.callsFake(() => ({ is_england: false }))
      stubs.getJson.callsFake(() => data.scotlandGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=kinghorn'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })

    it('should 301 redirect with legacy query parameter: invalid characters', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getFloodsWithin.callsFake(() => ({ floods: [] }))

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=warrington%*_'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(301)
      expect(response.headers.location).to.equal('/alerts-and-warnings/warrington')
    })

    it('should 200 with valid location', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getFloodsWithin.callsFake(() => data.fakeFloodsData)
      stubs.getStationsWithin.callsFake(() => [])
      stubs.getImpactsWithin.callsFake(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
    })

    it('should 404 with invalid location', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/not-found'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })

    it('should set the canonical url', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getFloodsWithin.callsFake(() => data.fakeFloodsData)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/warrington?active=true'
      }

      const response = await server.inject(options)

      expect(response.payload).to.contain('<link rel="canonical" href="http://localhost:3000/alerts-and-warnings/warrington"/>')
      expect(response.statusCode).to.equal(200)
    })

    it('should redirect to default page with parameter: "england"', async () => {
      stubs.getJson.callsFake(() => ({ floods: [] }))
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getOutlook.callsFake(() => outlookData.statements[0])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/england'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('/alerts-and-warnings')
    })

    it('should 404 with valid non-england location', async () => {
      stubs.getIsEngland.callsFake(() => ({ is_england: false }))
      stubs.getJson.callsFake(() => data.scotlandGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/kinghorn-fife'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })

    it('should 200 when visiting the default page', async () => {
      stubs.getFloods.callsFake(() => ({ floods: [] }))
      stubs.getStationsWithin.callsFake(() => [])
      stubs.getImpactsWithin.callsFake(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings'
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(200)
    })

    it('should 200 when visiting station page', async () => {
      stubs.getFloods.callsFake(() => ({ floods: [] }))
      stubs.getStationById.callsFake(() => data.fakeGetStationById)
      stubs.getWarningsAlertsWithinStationBuffer.callsFake(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?station=1001'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Beeding Bridge - flood alerts and warnings - GOV.UK')
    })

    it('should 200 when visiting page with an unknown parameter e.g. facebook click id ', async () => {
      stubs.getStationById.callsFake(() => data.fakeGetStationById)
      stubs.getWarningsAlertsWithinStationBuffer.callsFake(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?station=1001&fbclid=76896789uyuioyuioy&&&'
      }

      const response = await server.inject(options)

      expect(response.payload).to.contain('Beeding Bridge - flood alerts and warnings - GOV.UK')
      expect(response.statusCode).to.equal(200)
    })

    it('should 404 with non-latin characters', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)
      stubs.getFloods.callsFake(() => ({ floods: [] }))

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=你好'
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(404)
    })
  })

  describe('POST', () => {
    it('should return to default page when searching with non-latin characters', async () => {
      stubs.getJson.callsFake(() => {})
      stubs.getFloods.callsFake(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: '你好'
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
    })

    it('should 301 redirect when searching a location', async () => {
      stubs.getJson.callsFake(() => data.warringtonGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getFloodsWithin.callsFake(() => data.fakeFloodsData)

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'warrington'
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(301)
      expect(response.headers['content-type']).to.include('text/html')
    })

    it('should 302 to default page when searching: england', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)
      stubs.getIsEngland.callsFake(() => ({ is_england: true }))
      stubs.getFloodsWithin.callsFake(() => [])

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'england'
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(302)
      expect(response.headers.location).to.equal('/alerts-and-warnings')
    })

    it('should 302 to default page with invalid payload', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          river: 'Test'
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(302)
      expect(response.headers['content-type']).to.include('text/html')
      expect(response.headers.location).to.equal('alerts-and-warnings')
    })

    it('should 200 with empty location', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)
      stubs.getFloods.callsFake(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: ''
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(200)
      expect(response.headers['content-type']).to.include('text/html')
    })

    it('should 302 with no location', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)
      stubs.getFloods.callsFake(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings'
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(302)
    })

    it('should 200 with a finding a location error when exceeding the payload length limit', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)
      stubs.getFloods.callsFake(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: new Array(201).join('x')
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should 200 with a finding a location error from an invalid location', async () => {
      stubs.getJson.callsFake(() => data.nonLocationGetJson)
      stubs.getFloods.callsFake(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'not-found'
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should 200 with a finding a location error from a non-england location', async () => {
      stubs.getIsEngland.callsFake(() => ({ is_england: false }))
      stubs.getJson.callsFake(() => data.nonLocationGetJson)

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'kinghorn'
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).to.equal(200)
      expect(response.payload).to.contain('Error: Find location - Check for flooding - GOV.UK')
    })
  })
})
