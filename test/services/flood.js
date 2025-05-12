'use strict'
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const sinon = require('sinon')
const config = require('../../server/config')

describe('Flood service test', () => {
  let sandbox

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util.js')]
    sandbox = sinon.createSandbox()
    sandbox.stub(config, 'serviceUrl').value('http://server2')
  })

  afterEach(async () => {
    await sandbox.restore()
  })

  it('Check flood service exists', () => {
    const floodService = require('../../server/services/flood')
    expect(floodService).to.be.a.object()
  })
  it('Test getFloods endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/floods')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloods()

    expect(result).to.equal('ok')
  })
  it('Test getFloodsWithin endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/floods-within/1/2/3/4')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodsWithin([1, 2, 3, 4])

    expect(result).to.equal('ok')
  })
  it('Test getFloodArea endpoint warning', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/flood-area/warning/1234w')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234w')

    expect(result).to.equal('ok')
  })
  it('Test getFloodArea endpoint alert', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/flood-area/alert/1234a')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234a')

    expect(result).to.equal('ok')
  })
  it('Test getOutlook endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/flood-guidance-statement')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getOutlook()

    expect(result).to.equal('ok')
  })
  it('Test getStationById endpoint', async () => {
    const direction = 'u'
    const id = 1001

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/station/1001/u')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationById(id, direction)

    expect(result).to.equal('ok')
  })
  it('Test getStationsWithin endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-within/1/2/3/4')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithin([1, 2, 3, 4])

    expect(result).to.equal('ok')
  })
  it('Test getStationsWithinTargetArea', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-within-target-area/053FWFPUWI09')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithinTargetArea('053FWFPUWI09')

    expect(result).to.equal('ok')
  })
  it('Test getWarningsAlertsWithinStationBuffer', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/warnings-alerts-within-station-buffer/1001')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getWarningsAlertsWithinStationBuffer([1001])

    expect(result).to.equal('ok')
  })
  it('Test getRiverById', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/river/sankey-brook')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverById('sankey-brook')

    expect(result).to.equal('ok')
  })
  it('Test getRiversByName', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/river-name/tyne')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiversByName('tyne')

    expect(result).to.equal('ok')
  })
  it('Test getRiverStationByStationId', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/river-station-by-station-id/5031/u')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverStationByStationId(5031, 'u')

    expect(result).to.equal('ok')
  })
  it('Test getStationTelemetry endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/station/7077/u/telemetry')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationTelemetry(7077, 'u')

    expect(result).to.equal('ok')
  })
  it('Test getForecastFlag endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/forecast-station/2012/u')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getForecastFlag(2012, 'u')

    expect(result).to.equal('ok')
  })
  it('Test getStationForecastData endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/station/7077/forecast/data')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationForecastData(7077)

    expect(result).to.equal('ok')
  })
  it('Test getStationsGeoJson endpoint', async () => {
    const util = require('../../server/util')
    sandbox.stub(config, 'geoserverUrl').value('http://server1')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server1/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:stations&sortBy=atrisk&outputFormat=application%2Fjson')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsGeoJson()

    expect(result).to.equal('ok')
  })
  it('Test getRainfallGeojson endpoint', async () => {
    const util = require('../../server/util')
    sandbox.stub(config, 'geoserverUrl').value('http://server1')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server1/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:rainfall_stations&outputFormat=application%2Fjson')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallGeojson()

    expect(result).to.equal('ok')
  })
  it('Test getIsEngland endpoint', async () => {
    const lat = 1
    const lng = 2

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/is-england/2/1')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getIsEngland(lng, lat)

    expect(result).to.equal('ok')
  })
  it('Test getImpactsData endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/impacts/7077')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactData(7077)

    expect(result).to.equal('ok')
  })
  it('Test getImpactsWithin endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/impacts-within/1/2/3/4')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactsWithin([1, 2, 3, 4])

    expect(result).to.equal('ok')
  })
  it('Test getRivers endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/rivers')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRivers()

    expect(result).to.equal('ok')
  })
  it('Test getStationsOverview endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-overview')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsOverview()

    expect(result).to.equal('ok')
  })
  it('Test getServiceHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getServiceHealth()

    expect(result).to.equal('ok')
  })
  it('Test getGeoserverHealth endpoint', async () => {
    sandbox.stub(config, 'geoserverUrl').value('http://server2')

    const util = require('../../server/util')
    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert&maxFeatures=1&outputFormat=application%2Fjson')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getGeoserverHealth()

    expect(result).to.equal('ok')
  })
  it('Test getStationsHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-health')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsHealth()

    expect(result).to.equal('ok')
  })
  it('Test getTelemetryHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/telemetry-health')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getTelemetryHealth()

    expect(result).to.equal('ok')
  })
  it('Test getFfoiHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/ffoi-health')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFfoiHealth()

    expect(result).to.equal('ok')
  })
  it('Test getStationsByRadius endpoint', async () => {
    const util = require('../../server/util')

    const x = 1
    const y = 2

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-by-radius/1/2/8000')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsByRadius(x, y, 8000)

    expect(result).to.equal('ok')
  })
  it('Test getStationsByRadius endpoint with rad', async () => {
    const util = require('../../server/util')

    const x = 1
    const y = 2
    const rad = 8000

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-by-radius/1/2/8000')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsByRadius(x, y, rad)

    expect(result).to.equal('ok')
  })
  it('Test getError', async () => {
    const util = require('../../server/util')
    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/error')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getError()

    expect(result).to.equal('ok')
  })
  it('Test getRainfallStationTelemetry', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/rainfall-station-telemetry/E24195')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallStationTelemetry('E24195')

    expect(result).to.equal('ok')
  })
  it('Test getRainfallStation', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/rainfall-station/E24195')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallStation('E24195')

    expect(result).to.equal('ok')
  })
})
