'use strict'

const Hapi = require('@hapi/hapi')
const data = require('../data')
const outlookData = require('../data/outlook.json')

describe('Route - Alerts and Warnings', () => {
  let server
  let stubs

  beforeEach(async () => {
    jest.resetModules()
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]

    const floodService = require('../../server/services/flood')
    const util = require('../../server/util')

    stubs = {
      getJson: jest.spyOn(util, 'getJson').mockReturnValue(undefined),
      getIsEngland: jest.spyOn(floodService, 'getIsEngland').mockReturnValue(undefined),
      getFloods: jest.spyOn(floodService, 'getFloods').mockReturnValue(undefined),
      getFloodsWithin: jest.spyOn(floodService, 'getFloodsWithin').mockReturnValue(undefined),
      getStationsWithin: jest.spyOn(floodService, 'getStationsWithin').mockReturnValue(undefined),
      getImpactsWithin: jest.spyOn(floodService, 'getImpactsWithin').mockReturnValue(undefined),
      getStationById: jest.spyOn(floodService, 'getStationById').mockReturnValue(undefined),
      getOutlook: jest.spyOn(floodService, 'getOutlook').mockReturnValue(undefined),
      getWarningsAlertsWithinStationBuffer: jest.spyOn(floodService, 'getWarningsAlertsWithinStationBuffer').mockReturnValue(undefined)
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
    jest.restoreAllMocks()
    jest.resetModules()
    await server.stop()
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/alerts-and-warnings.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util')]
  })

  describe('GET', () => {
    it('should redirect with legacy query parameter', async () => {
      stubs.getJson.mockImplementation(() => data.warringtonGetJson)
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getFloodsWithin.mockImplementation(() => ({ floods: [] }))
      stubs.getStationsWithin.mockImplementation(() => [])
      stubs.getImpactsWithin.mockImplementation(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(301)
      expect(response.headers.location).toBe('/alerts-and-warnings/warrington')
    })

    it('should 404 with legacy query parameter invalid location', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=not-found'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(404)
      expect(response.headers.location).toEqual(undefined)
    })

    it('should 301 redirect with legacy query parameter: postcode', async () => {
      stubs.getJson.mockImplementation(() => data.warringtonGetJson)
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getFloodsWithin.mockImplementation(() => data.floodsByPostCode)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=WA4%201HT'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(301)
    })

    it('should 302 with legacy query parameter: "england"', async () => {
      stubs.getFloods.mockImplementation(() => ({
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
      stubs.getOutlook.mockImplementation(() => outlookData.statements[0])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=England'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/alerts-and-warnings')
    })

    it('should 404 with legacy query parameter: valid non-england location', async () => {
      stubs.getIsEngland.mockImplementation(() => ({ is_england: false }))
      stubs.getJson.mockImplementation(() => data.scotlandGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=kinghorn'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(404)
    })

    it('should 301 redirect with legacy query parameter: invalid characters', async () => {
      stubs.getJson.mockImplementation(() => data.warringtonGetJson)
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getFloodsWithin.mockImplementation(() => ({ floods: [] }))

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=warrington%*_'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(301)
      expect(response.headers.location).toBe('/alerts-and-warnings/warrington')
    })

    it('should 200 with valid location', async () => {
      stubs.getJson.mockImplementation(() => data.warringtonGetJson)
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getFloodsWithin.mockImplementation(() => data.fakeFloodsData)
      stubs.getStationsWithin.mockImplementation(() => [])
      stubs.getImpactsWithin.mockImplementation(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
    })

    it('should 404 with invalid location', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/not-found'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(404)
    })

    it('should set the canonical url', async () => {
      stubs.getJson.mockImplementation(() => data.warringtonGetJson)
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getFloodsWithin.mockImplementation(() => data.fakeFloodsData)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/warrington?active=true'
      }

      const response = await server.inject(options)

      expect(response.payload).toContain('rel="canonical" href="http://localhost:3000/alerts-and-warnings/warrington"')
      expect(response.statusCode).toBe(200)
    })

    it('should redirect to default page with parameter: "england"', async () => {
      stubs.getJson.mockImplementation(() => ({ floods: [] }))
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getOutlook.mockImplementation(() => outlookData.statements[0])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/england'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/alerts-and-warnings')
    })

    it('should 404 with valid non-england location', async () => {
      stubs.getIsEngland.mockImplementation(() => ({ is_england: false }))
      stubs.getJson.mockImplementation(() => data.scotlandGetJson)

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings/kinghorn-fife'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(404)
    })

    it('should 200 when visiting the default page', async () => {
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))
      stubs.getStationsWithin.mockImplementation(() => [])
      stubs.getImpactsWithin.mockImplementation(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings'
      }

      const response = await server.inject(options)
      expect(response.statusCode).toBe(200)
    })

    it('should 200 when visiting station page', async () => {
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))
      stubs.getStationById.mockImplementation(() => data.fakeGetStationById)
      stubs.getWarningsAlertsWithinStationBuffer.mockImplementation(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?station=1001'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Beeding Bridge - flood alerts and warnings - GOV.UK')
    })

    it('should 200 when visiting page with an unknown parameter e.g. facebook click id ', async () => {
      stubs.getStationById.mockImplementation(() => data.fakeGetStationById)
      stubs.getWarningsAlertsWithinStationBuffer.mockImplementation(() => [])

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?station=1001&fbclid=76896789uyuioyuioy&&&'
      }

      const response = await server.inject(options)

      expect(response.payload).toContain('Beeding Bridge - flood alerts and warnings - GOV.UK')
      expect(response.statusCode).toBe(200)
    })

    it('should 404 with non-latin characters', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))

      const options = {
        method: 'GET',
        url: '/alerts-and-warnings?q=你好'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST', () => {
    it('should return to default page when searching with non-latin characters', async () => {
      stubs.getJson.mockImplementation(() => {})
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: '你好'
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
    })

    it('should 301 redirect when searching a location', async () => {
      stubs.getJson.mockImplementation(() => data.warringtonGetJson)
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getFloodsWithin.mockImplementation(() => data.fakeFloodsData)

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'warrington'
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).toBe(301)
      expect(response.headers['content-type']).toContain('text/html')
    })

    it('should 302 to default page when searching: england', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)
      stubs.getIsEngland.mockImplementation(() => ({ is_england: true }))
      stubs.getFloodsWithin.mockImplementation(() => [])

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'england'
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('/alerts-and-warnings')
    })

    it('should 302 to default page with invalid payload', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          river: 'Test'
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).toBe(302)
      expect(response.headers['content-type']).toContain('text/html')
      expect(response.headers.location).toBe('alerts-and-warnings')
    })

    it('should 200 with empty location', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: ''
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('text/html')
    })

    it('should 302 with no location', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings'
      }

      const response = await server.inject(options)
      expect(response.statusCode).toBe(302)
    })

    it('should 200 with a finding a location error when exceeding the payload length limit', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: new Array(201).join('x')
        }
      }

      const response = await server.inject(options)
      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should 200 with a finding a location error from an invalid location', async () => {
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)
      stubs.getFloods.mockImplementation(() => ({ floods: [] }))

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'not-found'
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should 200 with a finding a location error from a non-england location', async () => {
      stubs.getIsEngland.mockImplementation(() => ({ is_england: false }))
      stubs.getJson.mockImplementation(() => data.nonLocationGetJson)

      const options = {
        method: 'POST',
        url: '/alerts-and-warnings',
        payload: {
          location: 'kinghorn'
        }
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Error: Find location - Check for flooding - GOV.UK')
    })
  })

  describe('non-England places and validation', () => {
    const nonEnglandPlace = { name: 'Kinghorn', slug: 'kinghorn', bbox2k: [], isEngland: { is_england: false } }

    it('should log and redirect a GET search for a non-England place', async () => {
      const locationService = require('../../server/services/location')
      jest.spyOn(locationService, 'find').mockResolvedValue([nonEnglandPlace])

      const response = await server.inject({ method: 'GET', url: '/alerts-and-warnings?q=kinghorn' })

      expect(response.statusCode).toBe(301)
      expect(response.headers.location).toBe('/alerts-and-warnings/kinghorn')
    })

    it('should show the location not found page for a POST search for a non-England place', async () => {
      const locationService = require('../../server/services/location')
      jest.spyOn(locationService, 'find').mockResolvedValue([nonEnglandPlace])

      const response = await server.inject({ method: 'POST', url: '/alerts-and-warnings', payload: { location: 'kinghorn' } })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should 404 when the location slug resolves to a non-England place', async () => {
      const locationService = require('../../server/services/location')
      jest.spyOn(locationService, 'get').mockResolvedValue([nonEnglandPlace])

      const response = await server.inject({ method: 'GET', url: '/alerts-and-warnings/kinghorn' })

      expect(response.statusCode).toBe(404)
    })

    it('should show the location not found page when the query is too long', async () => {
      const response = await server.inject({ method: 'GET', url: `/alerts-and-warnings?q=${'a'.repeat(201)}` })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Error: Find location - Check for flooding - GOV.UK')
    })

    it('should redirect to the default page when the location page query is invalid', async () => {
      const response = await server.inject({ method: 'GET', url: '/alerts-and-warnings/kinghorn?station=1&station=2' })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('alerts-and-warnings')
    })

    it('should look up the downstream station when the direction is downstream', async () => {
      const [getRoute] = require('../../server/routes/alerts-and-warnings')
      const getStationById = jest.fn().mockResolvedValue(data.fakeGetStationById)
      const request = {
        query: { station: '1001', direction: 'downstream' },
        yar: { set: jest.fn() },
        server: { methods: { flood: { getStationById, getWarningsAlertsWithinStationBuffer: jest.fn().mockResolvedValue([]) } } }
      }
      const h = { view: jest.fn().mockReturnValue('view') }

      await getRoute.handler(request, h)

      expect(getStationById).toHaveBeenCalledExactlyOnceWith('1001', 'd')
    })
  })
})
