'use strict'
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const config = require('../../server/config')

lab.experiment('Flood service test', () => {
  let sandbox

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util.js')]
    sandbox = sinon.createSandbox()
    sandbox.stub(config, 'serviceUrl').value('http://server2')
  })

  lab.afterEach(async () => {
    await sandbox.restore()
  })

  lab.test('Check flood service exists', () => {
    const floodService = require('../../server/services/flood')
    Code.expect(floodService).to.be.a.object()
  })
  lab.test('Test getFloods endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/floods')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloods()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getFloodsWithin endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/floods-within/1/2/3/4')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodsWithin([1, 2, 3, 4])

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getFloodArea endpoint warning', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/flood-area/warning/1234w')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234w')

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getFloodArea endpoint alert', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/flood-area/alert/1234a')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234a')

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getOutlook endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/flood-guidance-statement')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getOutlook()

    Code.expect(result).to.equal('ok')
  })
  // lab.test('Test getOutlook endpoint thrown error', async () => {
  //   const util = require('../../server/util')

  //   sandbox
  //     .mock(util)
  //     .expects('getJson')
  //     .withArgs('http://server2/flood-guidance-statement')
  //     .once()
  //     .throws({ statusCode: 400, error: 'Bad Request', message: 'Failed to get the flood guidance statement' })

  //   const floodService = require('../../server/services/flood')
  //   const result = await floodService.getOutlook()

  //   Code.expect(result).to.equal({ dataError: true })
  // })
  lab.test('Test getStationById endpoint', async () => {
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

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationsWithin endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-within/1/2/3/4')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithin([1, 2, 3, 4])

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationsWithinTargetArea', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-within-target-area/053FWFPUWI09')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithinTargetArea('053FWFPUWI09')

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getWarningsAlertsWithinStationBuffer', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/warnings-alerts-within-station-buffer/1001')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getWarningsAlertsWithinStationBuffer([1001])

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getRiverById', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/river/sankey-brook')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverById('sankey-brook')

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getRiverStationByStationId', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/river-station-by-station-id/5031')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverStationByStationId(5031)

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationTelemetry endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/station/7077/u/telemetry')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationTelemetry(7077, 'u')

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationForecastThresholds endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/station/7077/forecast/thresholds')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationForecastThresholds(7077)

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationForecastData endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/station/7077/forecast/data')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationForecastData(7077)

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationsGeoJson endpoint', async () => {
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

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getRainfallGeojson endpoint', async () => {
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

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getIsEngland endpoint', async () => {
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

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getImpactsData endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/impacts/7077')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactData(7077)

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getImpactsWithin endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/impacts-within/1/2/3/4')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactsWithin([1, 2, 3, 4])

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getRivers endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/rivers')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRivers()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationsOverview endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-overview')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsOverview()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getServiceHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getServiceHealth()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getGeoserverHealth endpoint', async () => {
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

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationsHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/stations-health')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsHealth()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getTelemetryHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/telemetry-health')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getTelemetryHealth()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getFfoiHealth endpoint', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/ffoi-health')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFfoiHealth()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationsByRadius endpoint', async () => {
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

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getStationsByRadius endpoint with rad', async () => {
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

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getError', async () => {
    const util = require('../../server/util')
    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/error')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getError()

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getRainfallStationTelemetry', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/rainfall-station-telemetry/E24195')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallStationTelemetry('E24195')

    Code.expect(result).to.equal('ok')
  })
  lab.test('Test getRainfallStation', async () => {
    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://server2/rainfall-station/E24195')
      .once()
      .returns('ok')

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRainfallStation('E24195')

    Code.expect(result).to.equal('ok')
  })
})
