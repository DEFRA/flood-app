'use strict'

describe('Service - Flood Endpoints', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.restoreAllMocks()
    const config = require('../../server/config')
    jest.replaceProperty(config, 'serviceUrl', 'http://server2')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return ok: getFloods', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloods()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/floods')
  })

  it('should return ok: getFloodsWithin', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodsWithin([1, 2, 3, 4])

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/floods-within/1/2/3/4')
  })

  it('should return ok: getFloodArea', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234w')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/flood-area/warning/1234w')
  })

  it('should return ok: getFloodArea', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234a')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/flood-area/alert/1234a')
  })

  it('should return ok: getOutlook', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getOutlook()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/flood-guidance-statement')
  })

  it('should return ok: getStationById', async () => {
    const direction = 'u'
    const id = 1001
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationById(id, direction)

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/station/1001/u')
  })

  it('should return ok: getStationsWithin', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithin([1, 2, 3, 4])

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/stations-within/1/2/3/4')
  })

  it('should return ok: getStationsWithinTargetArea', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithinTargetArea('053FWFPUWI09')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/stations-within-target-area/053FWFPUWI09')
  })

  it('should return ok: getWarningsAlertsWithinStationBuffer', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getWarningsAlertsWithinStationBuffer([1001])

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/warnings-alerts-within-station-buffer/1001')
  })

  it('should return ok: getRiverById', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverById('sankey-brook')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/river/sankey-brook')
  })

  it('should return ok: getRiversByName', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiversByName('tyne')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/river-name/tyne')
  })

  it('should return ok: getRiverStationByStationId', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverStationByStationId(5031, 'u')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/river-station-by-station-id/5031/u')
  })

  it('should return ok: getStationTelemetry', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationTelemetry(7077, 'u')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/station/7077/u/telemetry')
  })

  it('should return ok: getForecastFlag', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getForecastFlag(2012, 'u')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/forecast-station/2012/u')
  })

  it('should return ok: getStationForecastData', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationForecastData(7077)

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/station/7077/forecast/data')
  })

  it('should return ok: getStationsGeoJson', async () => {
    const config = require('../../server/config')
    jest.replaceProperty(config, 'geoserverUrl', 'http://server1')
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsGeoJson()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server1/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:stations&sortBy=atrisk&outputFormat=application%2Fjson')
  })

  it('should return ok: getRainfallGeojson', async () => {
    const config = require('../../server/config')
    jest.replaceProperty(config, 'geoserverUrl', 'http://server1')
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallGeojson()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server1/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:rainfall_stations&outputFormat=application%2Fjson')
  })

  it('should return ok: getIsEngland', async () => {
    const lat = 1
    const lng = 2
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getIsEngland(lng, lat)

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/is-england/2/1')
  })

  it('should return ok: getImpactsData', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactData(7077)

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/impacts/7077')
  })

  it('should return ok: getImpactsWithin', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactsWithin([1, 2, 3, 4])

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/impacts-within/1/2/3/4')
  })

  it('should return ok: getRivers', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getRivers()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/rivers')
  })

  it('should return ok: getStationsOverview', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsOverview()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/stations-overview')
  })

  it('should return ok: getServiceHealth', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getServiceHealth()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2')
  })

  it('should return ok: getGeoserverHealth', async () => {
    const config = require('../../server/config')
    jest.replaceProperty(config, 'geoserverUrl', 'http://server2')
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getGeoserverHealth()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert&maxFeatures=1&outputFormat=application%2Fjson')
  })

  it('should return ok: getStationsHealth', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsHealth()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/stations-health')
  })

  it('should return ok: getTelemetryHealth', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getTelemetryHealth()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/telemetry-health')
  })

  it('should return ok: getFfoiHealth', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getFfoiHealth()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/ffoi-health')
  })

  it('should return ok: getStationsByRadius', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')
    const x = 1
    const y = 2

    const result = await floodService.getStationsByRadius(x, y, 8000)

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/stations-by-radius/1/2/8000')
  })

  it('should return ok (with rad): getStationsByRadius', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')
    const x = 1
    const y = 2
    const rad = 8000

    const result = await floodService.getStationsByRadius(x, y, rad)

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/stations-by-radius/1/2/8000')
  })

  it('should return ok: getError', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getError()

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/error')
  })

  it('should return ok: getRainfallStationTelemetry', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallStationTelemetry('E24195')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/rainfall-station-telemetry/E24195')
  })

  it('should return ok: getRainfallStation', async () => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallStation('E24195')

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledTimes(1)
    expect(getJsonSpy).toHaveBeenCalledWith('http://server2/rainfall-station/E24195')
  })

  it.each([
    ['getStations', [], 'http://server2/stations'],
    ['getStationImtdThresholds', ['1001', 'u'], 'http://server2/station/1001/u/imtd-thresholds'],
    ['getTargetAreaThresholds', ['011FWFNC6KC'], 'http://server2/target-area/011FWFNC6KC/imtd-thresholds'],
    ['getTargetArea', ['011 FW'], 'http://server2/target-area/011%20FW'],
    ['getStationsByRadius', [1, 2], 'http://server2/stations-by-radius/1/2/8000'],
    ['getStationsByRadius', [1, 2, 500], 'http://server2/stations-by-radius/1/2/500'],
    ['getStationsByRadius', [1, 2, 0], 'http://server2/stations-by-radius/1/2']
  ])('should return ok: %s(%j)', async (method, args, expectedUrl) => {
    const util = require('../../server/util')
    const getJsonSpy = jest.spyOn(util, 'getJson').mockReturnValue('ok')
    const floodService = require('../../server/services/flood')

    const result = await floodService[method](...args)

    expect(result).toBe('ok')
    expect(getJsonSpy).toHaveBeenCalledExactlyOnceWith(expectedUrl)
  })
})
