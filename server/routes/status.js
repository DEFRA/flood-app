const floodService = require('../services/flood')
const locationService = require('../services/location')

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
      stations = null
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

    const model = {
      now: new Date(),
      pageTitle: 'Status',
      fwisDate: new Date(parseInt(floodService.floods.timestamp) * 1000),
      fwisAgeMinutes: parseInt((new Date() - new Date(parseInt(floodService.floods.timestamp) * 1000)) / (1000 * 60)),
      fwisCount: floodService.floods.floods.length || 0,
      outlookTimestamp: new Date(floodService.outlook.timestampOutlook),
      outlookAgeHours: parseInt((new Date() - new Date(floodService.outlook.timestampOutlook)) / (1000 * 60 * 60)),
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
      telemetry: telemetry,
      ffoi: ffoi
    }
    return h.view('status', model)
  }
}
