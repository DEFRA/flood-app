'use strict'
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')

lab.experiment('Flood service test', () => {
  let sandbox

  // Use a Sinon sandbox to manage spies, stubs and mocks for each test.
  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/util.js')]
    sandbox = await sinon.createSandbox()
  })

  lab.afterEach(async () => {
    await sandbox.restore()
  })

  lab.test('Check flood service exists', () => {
    const floodService = require('../../server/services/flood')
    Code.expect(floodService).to.be.a.object()
  })
  lab.test('Test getFloods endpoint', async () => {
    const fakeFloodData = { getFloods: 'TEST' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/floods')
      .once()
      .returns(fakeFloodData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloods()

    sandbox.verify()
    Code.expect(result).to.equal(fakeFloodData)
  })
  lab.test('Test getFloodsWithin endpoint', async () => {
    const bbox = [1, 2, 3, 4]

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/floods-within/1/2/3/4')
      .once()
      .returns(bbox)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodsWithin([1, 2, 3, 4])

    sandbox.verify()
    Code.expect(result).to.equal(bbox)
  })
  lab.test('Test getFloodArea endpoint warning', async () => {
    const fakeFloodData = { getFloodArea: 'TEST' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/flood-area/warning/1234w')
      .once()
      .returns(fakeFloodData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234w')

    Code.expect(result).to.be.an.object()
    Code.expect(result).to.equal(fakeFloodData)
  })
  lab.test('Test getFloodArea endpoint alert', async () => {
    const fakeFloodData = { getFloodArea: 'TEST' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/flood-area/alert/1234a')
      .once()
      .returns(fakeFloodData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFloodArea('1234a')

    Code.expect(result).to.be.an.object()
    Code.expect(result.getFloodArea).to.equal('TEST')
  })
  lab.test('Test getOutlook endpoint', async () => {
    const fakeFloodData = {}

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/flood-guidance-statement')
      .once()
      .returns(fakeFloodData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getOutlook()

    Code.expect(result).to.equal({})
  })
  lab.test('Test  getStationById endpoint', async () => {
    const direction = 'u'
    const id = 1001

    const station = { station: 1001 }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/station/1001/u')
      .once()
      .returns(station)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationById(id, direction)

    sandbox.verify()
    Code.expect(result).to.equal(station)
  })
  lab.test('Test  getStationsWithin endpoint', async () => {
    const bbox = [1, 2, 3, 4]

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/stations-within/1/2/3/4')
      .once()
      .returns(bbox)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithin([1, 2, 3, 4])

    sandbox.verify()
    Code.expect(result).to.equal(bbox)
  })
  lab.test('Test getStationsWithinTargetArea', async () => {
    const fakeStation = { Station: '1001' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/stations-within-target-area/053FWFPUWI09')
      .once()
      .returns(fakeStation)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsWithinTargetArea('053FWFPUWI09')

    sandbox.verify()
    Code.expect(result).to.equal(fakeStation)
  })
  lab.test('Test getWarningsAlertsWithinStationBuffer', async () => {
    const fakeAlert = { Alert: 'sankey-brook' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/warnings-alerts-within-station-buffer/1/2')
      .once()
      .returns(fakeAlert)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getWarningsAlertsWithinStationBuffer([1, 2])

    sandbox.verify()
    Code.expect(result).to.equal(fakeAlert)
  })
  lab.test('Test getRiverById', async () => {
    const fakeRiverData = { riverId: 'sankey-brook' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/river/sankey-brook')
      .once()
      .returns(fakeRiverData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverById('sankey-brook')

    sandbox.verify()
    Code.expect(result).to.equal(fakeRiverData)
  })
  lab.test('Test getRiverStationByStationId', async () => {
    const fakeRiverStationData = { riverStationId: '5031' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/river-station-by-station-id/5031')
      .once()
      .returns(fakeRiverStationData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getRiverStationByStationId(5031)

    sandbox.verify()
    Code.expect(result).to.equal(fakeRiverStationData)
  })
  lab.test('Test getStationTelemetry endpoint', async () => {
    const fakeFloodData = { getStationTelemetry: 'TEST' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/station/7077/u/telemetry')
      .once()
      .returns(fakeFloodData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationTelemetry(7077, 'u')

    Code.expect(result).to.be.an.object()
    Code.expect(result.getStationTelemetry).to.equal('TEST')
  })
  lab.test('Test getStationForecastThresholds endpoint', async () => {
    const fakeFloodData = { getStationForecastThresholds: 'TEST' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/station/7077/forecast/thresholds')
      .once()
      .returns(fakeFloodData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationForecastThresholds(7077)

    Code.expect(result).to.be.an.object()
    Code.expect(result.getStationForecastThresholds).to.equal('TEST')
  })
  lab.test('Test getStationForecastData endpoint', async () => {
    const fakeFloodData = { getStationForecastData: 'TEST' }

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/station/7077/forecast/data')
      .once()
      .returns(fakeFloodData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationForecastData(7077)

    Code.expect(result).to.be.an.object()
    Code.expect(result.getStationForecastData).to.equal('TEST')
  })
  lab.test('Test getIsEngland endpoint', async () => {
    const lat = 1
    const lng = 2

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/is-england/2/1')
      .once()
      .returns(true)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getIsEngland(lng, lat)

    sandbox.verify()
    Code.expect(result).to.equal(true)
  })
  lab.test('Test getImpactsData endpoint', async () => {
    const id = '7077'

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/impacts/7077')
      .once()
      .returns(id)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactData(7077)

    sandbox.verify()
    Code.expect(result).to.equal(id)
  })
  lab.test('Test getImpactsWithin endpoint', async () => {
    const bbox = [1, 2, 3, 4]

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/impacts-within/1/2/3/4')
      .once()
      .returns(bbox)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getImpactsWithin([1, 2, 3, 4])

    sandbox.verify()
    Code.expect(result).to.equal(bbox)
  })
  lab.test('Test getStationsOverview endpoint', async () => {
    const fakeStationsData = [{ station: 1001 }, { station: 1002 }]

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/stations-overview')
      .once()
      .returns(fakeStationsData)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsOverview()

    sandbox.verify()
    Code.expect(result).to.equal(fakeStationsData)
  })
  lab.test('Test getServiceHealth endpoint', async () => {
    const serviceURL = 'http://localhost:8050'

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050')
      .once()
      .returns(serviceURL)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getServiceHealth()

    sandbox.verify()
    Code.expect(result).to.equal(serviceURL)
  })
  lab.test('Test getStationsHealth endpoint', async () => {
    const stationHealthURL = 'http://localhost:8050/stations-health'

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/stations-health')
      .once()
      .returns(stationHealthURL)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getStationsHealth()

    sandbox.verify()
    Code.expect(result).to.equal(stationHealthURL)
  })
  lab.test('Test getTelemetryHealth endpoint', async () => {
    const telemetryHealthURL = 'http://localhost:8050/telemetry-health'

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/telemetry-health')
      .once()
      .returns(telemetryHealthURL)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getTelemetryHealth()

    sandbox.verify()

    Code.expect(result).to.equal(telemetryHealthURL)
  })
  lab.test('Test getFfoiHealth endpoint', async () => {
    const ffoiHealthURL = 'http://localhost:8050/ffoi-health'

    const util = require('../../server/util')

    sandbox
      .mock(util)
      .expects('getJson')
      .withArgs('http://localhost:8050/ffoi-health')
      .once()
      .returns(ffoiHealthURL)

    const floodService = require('../../server/services/flood')

    const result = await floodService.getFfoiHealth()

    sandbox.verify()
    Code.expect(result).to.equal(ffoiHealthURL)
  })
})
