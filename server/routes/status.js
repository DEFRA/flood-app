const floodService = require('../services/flood')
const locationService = require('../services/location')
const OutlookModel = require('../models/outlook')
const FloodsModel = require('../models/floods')

module.exports = {
  method: 'GET',
  path: '/status',
  handler: async (_request, h) => {
    // test location services
    let place, locationStart, locationEnd
    try {
      locationStart = new Date()
      place = await locationService.find('Warrington')
      locationEnd = new Date()
    } catch (err) {
      console.error(`Location search error: [${err.name}] [${err.message}]`)
      console.error(err)
      place = null
      locationEnd = new Date()
    }

    // test backend services
    let service, serviceStart, serviceEnd
    try {
      serviceStart = new Date()
      service = await floodService.getServiceHealth()
      serviceEnd = new Date()
    } catch (err) {
      service = null
      serviceEnd = new Date()
    }

    // test geoserver
    let geoserver, geoserverStart, geoserverEnd
    try {
      geoserverStart = new Date()
      geoserver = await floodService.getGeoserverHealth()
      geoserverEnd = new Date()
    } catch (err) {
      geoserver = null
      geoserverEnd = new Date()
    }

    // station health
    let stations, stationsStart, stationsEnd
    try {
      stationsStart = new Date()
      stations = await floodService.getStationsHealth()
      stationsEnd = new Date()
    } catch (err) {
      stations = {
        count: 0,
        timestamp: null
      }
      stationsEnd = new Date()
    }

    // telemetry health
    let telemetry
    try {
      telemetry = await floodService.getTelemetryHealth()
    } catch (err) {
      telemetry = null
    }

    // FFOI health
    let ffoi
    try {
      ffoi = await floodService.getFfoiHealth()
    } catch (err) {
      ffoi = null
    }

    // outlook
    let outlook
    try {
      outlook = new OutlookModel(await floodService.getOutlook())
    } catch (err) {
      outlook = null
    }

    // floods
    let floods
    try {
      floods = new FloodsModel(await floodService.getFloods())
    } catch (err) {
      floods = null
    }

    const model = {
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
      servicems: serviceEnd - serviceStart,
      geoserver: geoserver ? 'Successful' : 'Failed',
      geoserverms: geoserverEnd - geoserverStart,
      database: stations ? 'Successful' : 'Failed',
      databasems: stationsEnd - stationsStart,
      stationsTimestamp: new Date(parseInt(stations.timestamp) * 1000),
      stationsAgeDays: parseInt((new Date() - new Date(parseInt(stations.timestamp) * 1000)) / (1000 * 60 * 60 * 24)),
      stationsCount: stations.count || 0,
      telemetry,
      ffoi
    }
    return h.view('status', model)
  }
}
