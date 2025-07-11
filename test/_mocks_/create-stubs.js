const sinon = require('sinon')

const createStubs = async () => {
  const floodService = require('../../server/services/flood')
  const util = require('../../server/util')

  const sandbox = sinon.createSandbox()

  return {
    sandbox,
    stubs: {
      getJson: sandbox.stub(util, 'getJson'),
      getIsEngland: sandbox.stub(floodService, 'getIsEngland'),
      getFloods: sandbox.stub(floodService, 'getFloods'),
      getFloodsWithin: sandbox.stub(floodService, 'getFloodsWithin'),
      getStationsWithin: sandbox.stub(floodService, 'getStationsWithin'),
      getImpactsWithin: sandbox.stub(floodService, 'getImpactsWithin'),
      getStationById: sandbox.stub(floodService, 'getStationById'),
      getOutlook: sandbox.stub(floodService, 'getOutlook'),
      getWarningsAlertsWithinStationBuffer: sandbox.stub(floodService, 'getWarningsAlertsWithinStationBuffer'),
      getStations: sandbox.stub(floodService, 'getStations'),
      getStationsByRadius: sandbox.stub(floodService, 'getStationsByRadius'),
      getStationsGeoJson: sandbox.stub(floodService, 'getStationsGeoJson'),
      getStationsWithinTargetArea: sandbox.stub(floodService, 'getStationsWithinTargetArea'),
      getRainfallStation: sandbox.stub(floodService, 'getRainfallStation'),
      getRiverById: sandbox.stub(floodService, 'getRiverById'),
      getRiversByName: sandbox.stub(floodService, 'getRiversByName'),
      getTargetArea: sandbox.stub(floodService, 'getTargetArea')
    }
  }
}

module.exports = createStubs
