'use strict'
const Hapi = require('@hapi/hapi')
const data = require('../data')

describe('Route - API', () => {
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/util.js')]
    delete require.cache[require.resolve('../../server/services/location.js')]

    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
  })

  describe('/warnings', () => {
    it('should 200 with stations geojson', async () => {
      const getStationsGeojson = () => {
        return JSON.parse('{"type": "FeatureCollection", "features": []}')
      }

      const floodService = require('../../server/services/flood')
      jest.spyOn(floodService, 'getStationsGeoJson').mockImplementation(getStationsGeojson)

      // Fake the cached rainfall data
      floodService.stationsGeojson = await floodService.getStationsGeoJson()

      const route = {
        plugin: {
          name: 'stations',
          register: (server) => {
            server.route(require('../../server/routes/api/stations.geojson'))
          }
        }
      }

      await server.register(require('../../server/plugins/session'))
      await server.register(route)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/stations.geojson'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('{"type":"FeatureCollection","features":[]}')
    })

    it('should 200 with rainfall geojson', async () => {
      const getRainfallGeojson = () => {
        return JSON.parse('{"type": "FeatureCollection", "features": []}')
      }

      const floodService = require('../../server/services/flood')

      jest.spyOn(floodService, 'getRainfallGeojson').mockImplementation(getRainfallGeojson)

      floodService.rainfallGeojson = await floodService.getRainfallGeojson()

      const route = {
        plugin: {
          name: 'rainfall',
          register: (server) => {
            server.route(require('../../server/routes/api/rainfall.geojson'))
          }
        }
      }

      await server.register(require('../../server/plugins/session'))
      await server.register(route)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/rainfall.geojson'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('{"type":"FeatureCollection","features":[]}')
    })

    it('should 200 with location query parameter', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => data.fakeFloodsData

      jest.spyOn(floodService, 'getIsEngland').mockImplementation(fakeIsEngland)
      jest.spyOn(floodService, 'getFloodsWithin').mockImplementation(fakeFloodsData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      jest.spyOn(util, 'getJson').mockImplementation(fakeGetJson)

      const warningsPlugin = {
        plugin: {
          name: 'warnings',
          register: (server) => {
            server.route(require('../../server/routes/api/warnings'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(warningsPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/warnings?location=Warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)

      const payload = JSON.parse(response.payload)

      expect(payload.severity).toBe(3)
      expect(payload.message).toBe('There are currently one severe flood warning, one flood warning and 3 flood alerts in force at this location.')
    })

    it('should 200 with no location', async () => {
      const floodService = require('../../server/services/flood')

      const fakeFloodData = () => {
        return {
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
        }
      }

      jest.spyOn(floodService, 'getFloods').mockImplementation(fakeFloodData)

      const warningsPlugin = {
        plugin: {
          name: 'warnings',
          register: (server) => {
            server.route(require('../../server/routes/api/warnings'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(warningsPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/warnings'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)

      const payload = JSON.parse(response.payload)
      expect(payload.severity).toBe(2)
      expect(payload.message).toBe('There is currently one flood warning in force.')
    })

    it('should 400 with an invalid query parameter', async () => {
      const floodService = require('../../server/services/flood')

      const fakeIsEngland = () => {
        return { is_england: true }
      }

      const fakeFloodsData = () => data.fakeFloodsData

      jest.spyOn(floodService, 'getIsEngland').mockImplementation(fakeIsEngland)
      jest.spyOn(floodService, 'getFloodsWithin').mockImplementation(fakeFloodsData)

      const fakeGetJson = () => data.warringtonGetJson

      const util = require('../../server/util')

      jest.spyOn(util, 'getJson').mockImplementation(fakeGetJson)

      const warningsPlugin = {
        plugin: {
          name: 'warnings',
          register: (server) => {
            server.route(require('../../server/routes/api/warnings'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(warningsPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/warnings?locati=warrington'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(400)
    })

    it('should 200 with no warnings', async () => {
      const floodService = require('../../server/services/flood')

      const fakeFloodData = () => {
        return {
          floods: []
        }
      }

      jest.spyOn(floodService, 'getFloods').mockImplementation(fakeFloodData)

      const warningsPlugin = {
        plugin: {
          name: 'warnings',
          register: (server) => {
            server.route(require('../../server/routes/api/warnings'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(warningsPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/warnings'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)

      const payload = JSON.parse(response.payload)

      expect(payload.severity).toBe(5)
      expect(payload.message).toBe('There are currently no flood warnings or alerts in force.')
    })

    it('should 200 with no location, returning one alert', async () => {
      const floodService = require('../../server/services/flood')

      const fakeFloodData = () => {
        return {
          floods: [
            {
              ta_code: '013FWFCH29',
              id: 4558714,
              ta_name: 'Wider area at risk from Sankey Brook at Dallam',
              quick_dial: '305027',
              region: 'Midlands',
              area: 'Central',
              floodtype: 'f',
              severity_value: 1,
              severitydescription: 'Flood Alert',
              warningkey: 1,
              message_received: '2020-01-08T13:09:09.628Z',
              severity_changed: '2020-01-08T13:09:09.628Z',
              situation_changed: '2020-01-08T13:09:09.628Z',
              situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elits nibh.'
            }
          ]
        }
      }

      jest.spyOn(floodService, 'getFloods').mockImplementation(fakeFloodData)

      const warningsPlugin = {
        plugin: {
          name: 'warnings',
          register: (server) => {
            server.route(require('../../server/routes/api/warnings'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(warningsPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/warnings'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)

      const payload = JSON.parse(response.payload)

      expect(payload.severity).toBe(1)
      expect(payload.message).toBe('There is currently one flood alert in force.')
    })

    it('should 200 with no location, returning one severe warning', async () => {
      const floodService = require('../../server/services/flood')

      const fakeFloodData = () => {
        return {
          floods: [
            {
              ta_code: '013FWFCH29',
              id: 4558714,
              ta_name: 'Wider area at risk from Sankey Brook at Dallam',
              quick_dial: '305027',
              region: 'Midlands',
              area: 'Central',
              floodtype: 'f',
              severity_value: 3,
              severitydescription: 'Severe Flood Warning',
              warningkey: 1,
              message_received: '2020-01-08T13:09:09.628Z',
              severity_changed: '2020-01-08T13:09:09.628Z',
              situation_changed: '2020-01-08T13:09:09.628Z',
              situation: 'Lorem ipsum dolor sit amet, consectetur adipiscing elits nibh.'
            }
          ]
        }
      }

      jest.spyOn(floodService, 'getFloods').mockImplementation(fakeFloodData)

      const warningsPlugin = {
        plugin: {
          name: 'warnings',
          register: (server) => {
            server.route(require('../../server/routes/api/warnings'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(warningsPlugin)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/warnings'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)

      const payload = JSON.parse(response.payload)

      expect(payload.severity).toBe(3)
      expect(payload.message).toBe('There is currently one severe flood warning in force.')
    })
  })

  describe('/latest-levels/{target-area}', () => {
    it('should return latest level data', async () => {
      const floodService = require('../../server/services/flood')

      const fakeFloodData = async () => ({
        floods: [
          {
            ta_id: 2625,
            ta_code: '111FAGSPGW',
            ta_name: 'Groundwater flooding in the Salisbury Plain area',
            ta_description: 'Boscombe, Cholderton, Collingbourne Ducis, Hanging Langford, Hindon, Hurdcott, Idmiston, Newton Tony, Orcheston, Porton, Salisbury, Shipton Bellinger, Shrewton, Stratford Sub Castle, Tidworth, Tilshead, Tisbury, Wilton, Winterbourne Stoke and Woodford',
            situation: 'TEST - Enter flood situation message here',
            quick_dial: 210022,
            situation_changed: '2025-04-15T09:30:00.000Z',
            severity_changed: '2025-04-17T09:30:00.000Z',
            message_received: '2025-04-17T11:23:11.175Z',
            severity_value: 3,
            severity: 'Severe flood warning',
            geometry: '{"type":"Point","coordinates":[-1.902707064,51.208434127]}'
          }
        ]
      })

      const fakeTAThresholdsData = async () => (
        [
          {
            rloi_id: 9162,
            river_name: 'Groundwater',
            station_threshold_id: '110348',
            agency_name: 'Clarendon OB6',
            external_name: 'Clarendon',
            station_type: 'G',
            status: 'Active',
            iswales: false,
            latest_level: '67.47',
            threshold_value: '123.00',
            direction: 'u',
            threshold_type: 'FW RES FW',
            value_timestamp: '27 minutes ago',
            post_process: false,
            stage_datum: '0',
            subtract: null,
            severity_value: 3,
            formatted_time: '27 minutes ago',
            isSuspendedOrOffline: false,
            isGroundwater: true,
            isCoastal: false
          }
        ]
      )

      jest.spyOn(floodService, 'getFloods').mockImplementation(fakeFloodData)
      jest.spyOn(floodService, 'getTargetAreaThresholds').mockImplementation(fakeTAThresholdsData)

      const latestLevelsPlugin = {
        plugin: {
          name: 'latest-levels',
          register: (server, options) => {
            server.route(require('../../server/routes/api/latest-levels'))
          }
        }
      }

      await server.register(require('../../server/plugins/views'))
      await server.register(require('../../server/plugins/session'))
      await server.register(latestLevelsPlugin)

      const registerServerMethods = require('../../server/services/server-methods')

      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/latest-levels/111FAGSPGW'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)

      const payload = JSON.parse(response.payload)

      expect(payload.severity).toBe('severe')
      expect(payload.levels.length).toBe(1)
      expect(payload.levels[0].river_name).toBe('Groundwater')
      expect(payload.levels[0].isGroundwater).toEqual(true)
    })
  })

  describe('/webchat', () => {
    it('should 200 returning "AVAILABLE" availability', async () => {
      const getAvailability = async () => ({ availability: 'AVAILABLE', date: new Date('2022-09-25T00:00:00.000Z') })

      const webchatService = require('../../server/services/webchat')
      jest.spyOn(webchatService, 'getAvailability').mockImplementation(getAvailability)

      const route = {
        plugin: {
          name: 'webchat',
          register: (server) => {
            server.route(require('../../server/routes/api/webchat-availability'))
          }
        }
      }

      await server.register(require('../../server/plugins/session'))
      await server.register(route)

      const registerServerMethods = require('../../server/services/server-methods')
      registerServerMethods(server)

      await server.initialize()

      const options = {
        method: 'GET',
        url: '/api/webchat/availability'
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('{"availability":"AVAILABLE","date":"2022-09-25T00:00:00.000Z"}')
    })
  })
})
