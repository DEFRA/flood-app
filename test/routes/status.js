'use strict'

const data = require('../data')
const floodService = require('../../server/services/flood')
const locationService = require('../../server/services/location')
const statusRoute = require('../../server/routes/status')

describe('Route - Status', () => {
  const h = { view: jest.fn((template, context) => context) }
  let request

  beforeEach(() => {
    h.view.mockClear()
    request = { logger: { warn: jest.fn() } }
  })

  it('should report all services as successful when they respond', async () => {
    jest.spyOn(locationService, 'find').mockResolvedValue([{ name: 'Warrington' }])
    jest.spyOn(floodService, 'getServiceHealth').mockResolvedValue({ ok: true })
    jest.spyOn(floodService, 'getGeoserverHealth').mockResolvedValue({ ok: true })
    jest.spyOn(floodService, 'getStationsHealth').mockResolvedValue({ count: 3, timestamp: '1600000000' })
    jest.spyOn(floodService, 'getTelemetryHealth').mockResolvedValue('telemetry')
    jest.spyOn(floodService, 'getFfoiHealth').mockResolvedValue('ffoi')
    jest.spyOn(floodService, 'getOutlook').mockResolvedValue(data.fgs)
    jest.spyOn(floodService, 'getFloods').mockResolvedValue({ timestamp: '1600000000', floods: [{}, {}] })

    const context = await statusRoute.handler(request, h)

    expect(h.view).toHaveBeenCalledWith('status', expect.any(Object))
    expect(context).toMatchObject({
      pageTitle: 'Status',
      locationService: 'Successful',
      service: 'Successful',
      geoserver: 'Successful',
      database: 'Successful',
      stationsCount: 3,
      fwisCount: 2,
      telemetry: 'telemetry',
      ffoi: 'ffoi'
    })
    expect(request.logger.warn).not.toHaveBeenCalled()
  })

  it('should report failures and log a location error when services fail', async () => {
    const error = new Error('bing down')
    jest.spyOn(locationService, 'find').mockRejectedValue(error)
    jest.spyOn(floodService, 'getServiceHealth').mockRejectedValue(new Error('down'))
    jest.spyOn(floodService, 'getGeoserverHealth').mockRejectedValue(new Error('down'))
    jest.spyOn(floodService, 'getStationsHealth').mockRejectedValue(new Error('down'))
    jest.spyOn(floodService, 'getTelemetryHealth').mockRejectedValue(new Error('down'))
    jest.spyOn(floodService, 'getFfoiHealth').mockRejectedValue(new Error('down'))
    jest.spyOn(floodService, 'getOutlook').mockResolvedValue(data.fgs)
    jest.spyOn(floodService, 'getFloods').mockResolvedValue({ timestamp: '1600000000', floods: [] })

    const context = await statusRoute.handler(request, h)

    expect(context).toMatchObject({
      locationService: 'Failed',
      service: 'Failed',
      geoserver: 'Failed',
      database: 'Successful',
      stationsCount: 0,
      fwisCount: 0,
      telemetry: null,
      ffoi: null
    })
    expect(request.logger.warn).toHaveBeenCalledExactlyOnceWith({
      situation: 'Location search error: [Error] [bing down]',
      err: error
    })
  })
})
