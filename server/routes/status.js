const floodService = require('../services/flood')
const locationService = require('../services/location')
const OutlookModel = require('../models/outlook-map')
const FloodsModel = require('../models/floods')

module.exports = {
  method: 'GET',
  path: '/status',
  handler: async (request, h) => {
    // test location services
    let place, locationStart, locationEnd
    try {
      locationStart = new Date()
      place = await locationService.find('Warrington')
      locationEnd = new Date()
    } catch (err) {
      request.logger.warn({
        situation: `Location search error: [${err.name}] [${err.message}]`,
        err
      })
      place = null
      locationEnd = new Date()
    }

    // test backend services
    const {
      result: service,
      durationMs: servicems
    } = await getDataWithDefaultAndDuration(floodService.getServiceHealth)

    // test geoserver
    const {
      result: geoserver,
      durationMs: geoserverms
    } = await getDataWithDefaultAndDuration(floodService.getGeoserverHealth)

    // station health
    const {
      result: stations,
      durationMs: stationsms
    } = await getDataWithDefaultAndDuration(floodService.getStationsHealth, {
      count: 0,
      timestamp: null
    })

    // telemetry health
    const {
      result: telemetry
    } = await getDataWithDefaultAndDuration(floodService.getTelemetryHealth)

    // FFOI health
    const {
      result: ffoi
    } = await getDataWithDefaultAndDuration(floodService.getFfoiHealth)

    // outlook
    const {
      result: outlook
    } = await getDataWithDefaultAndDuration(async () => new OutlookModel(await floodService.getOutlook(), request.logger))

    // floods
    const {
      result: floods
    } = await getDataWithDefaultAndDuration(async () => new FloodsModel(await floodService.getFloods()))

    return h.view('status', {
      now: new Date(),
      pageTitle: 'Status',
      fwisDate: new Date(parseInt(floods.timestamp) * 1000),
      fwisAgeMinutes: parseInt((new Date() - new Date(parseInt(floods.timestamp) * 1000)) / (1000 * 60)),
      fwisCount: floods.floods.length || 0,
      outlookTimestamp: new Date(outlook.timestampOutlook),
      outlookAgeHours: parseInt((new Date() - new Date(outlook.timestampOutlook)) / (1000 * 60 * 60)),
      locationService: place ? 'Successful' : 'Failed',
      locationServicems: locationEnd - locationStart,
      service: service ? 'Successful' : 'Failed',
      geoserver: geoserver ? 'Successful' : 'Failed',
      database: stations ? 'Successful' : 'Failed',
      databasems: stationsms,
      stationsTimestamp: new Date(parseInt(stations.timestamp) * 1000),
      stationsAgeDays: parseInt((new Date() - new Date(parseInt(stations.timestamp) * 1000)) / (1000 * 60 * 60 * 24)),
      stationsCount: stations.count || 0,
      servicems,
      geoserverms,
      telemetry,
      ffoi
    })
  }
}

async function getDataWithDefaultAndDuration (fn, defaultValue = null) {
  const start = Date.now()
  let result
  let end

  try {
    result = await fn()
  } catch (err) {
    result = defaultValue
  } finally {
    end = Date.now()
  }

  return {
    result,
    durationMs: end - start
  }
}
