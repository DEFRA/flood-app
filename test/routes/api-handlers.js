'use strict'

const data = require('../data')
const OutlookModel = require('../../server/models/outlook')
const FloodsModel = require('../../server/models/floods')
const outlookRoute = require('../../server/routes/api/outlook')
const owsRoute = require('../../server/routes/api/ows')
const warningsGeojsonRoute = require('../../server/routes/api/warnings.geojson')
const latestLevelsRoute = require('../../server/routes/api/latest-levels')
const stationsOverviewRoute = require('../../server/routes/stations-overview')
const { geoserverUrl } = require('../../server/config')

const buildRequest = (methods = {}, extra = {}) => ({
  server: { methods: { flood: methods } },
  logger: { warn: jest.fn() },
  ...extra
})

describe('Route handlers - API', () => {
  describe('/api/outlook.geojson', () => {
    it('should return the outlook geojson', async () => {
      const getOutlook = jest.fn().mockResolvedValue(data.fgs)

      const result = await outlookRoute.options.handler(buildRequest({ getOutlook }))

      expect(result).toEqual(new OutlookModel(data.fgs).geoJson)
    })
  })

  describe('/api/warnings.geojson', () => {
    it('should return the warnings geojson', async () => {
      const getFloods = jest.fn().mockResolvedValue(data.fakeFloodsData)

      const result = await warningsGeojsonRoute.options.handler(buildRequest({ getFloods }))

      expect(result).toEqual(new FloodsModel(data.fakeFloodsData).geojson)
    })
  })

  describe('/api/ows', () => {
    it('should proxy the request search string to geoserver', () => {
      const { uri } = owsRoute.handler.proxy.mapUri({ url: { search: '?service=WFS' } })

      expect(uri).toBe(`${geoserverUrl}/geoserver/flood/ows?service=WFS`)
    })
  })

  describe('/api/latest-levels/{code}', () => {
    const params = { code: '011FWFNC6KC' }

    it('should return no levels when there are no thresholds', async () => {
      const request = buildRequest({
        getTargetAreaThresholds: jest.fn().mockResolvedValue(null),
        getFloods: jest.fn().mockResolvedValue({ floods: [] })
      }, { params })

      const result = await latestLevelsRoute.options.handler(request)

      expect(result).toEqual({ severity: undefined, levels: [] })
    })

    it('should return no levels and a null severity when the services error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockReturnValue(undefined)
      const error = new Error('service unavailable')
      const request = buildRequest({
        getTargetAreaThresholds: jest.fn().mockRejectedValue(error)
      }, { params })

      const result = await latestLevelsRoute.options.handler(request)

      expect(result).toEqual({ levels: [], severity: null })
      expect(consoleSpy).toHaveBeenCalledWith(error)
    })
  })
})

describe('Route handlers - Stations overview', () => {
  it('should render the stations overview view', async () => {
    const stations = [{ rloi_id: 1 }]
    const h = { view: jest.fn().mockReturnValue('view') }

    const result = await stationsOverviewRoute.handler(buildRequest({ getStationsOverview: jest.fn().mockResolvedValue(stations) }), h)

    expect(result).toBe('view')
    expect(h.view).toHaveBeenCalledExactlyOnceWith('stations-overview', { stations })
  })
})
