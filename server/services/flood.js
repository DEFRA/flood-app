const util = require('../util')
const { serviceUrl, geoserverUrl } = require('../config')

// cached flood data
// const Floods = require('../models/floods')
// let floods = null

module.exports = {
  getFloods () {
    return util.getJson(`${serviceUrl}/floods`)
  },

  getFloodsWithin (bbox) {
    const xyCoordsPath = bbox.join('/')
    return util.getJson(`${serviceUrl}/floods-within/${xyCoordsPath}`)
  },

  getFloodArea (code) {
    // 5th character of code states "w" or "a"
    // for warning or alert flood area types
    const type = code.charAt(4).toLowerCase() === 'w'
      ? 'warning'
      : 'alert'

    return util.getJson(`${serviceUrl}/flood-area/${type}/${code}`)
  },

  // fetching the flood guidance statement using service layer leveraging s3
  getOutlook () {
    return util.getJson(`${serviceUrl}/flood-guidance-statement`)
  },

  getStationById (id, direction) {
    return util.getJson(`${serviceUrl}/station/${id}/${direction}`)
  },

  getStations () {
    return util.getJson(`${serviceUrl}/stations`)
  },

  getStationsWithin (bbox) {
    const xyCoordsPath = bbox.join('/')
    return util.getJson(`${serviceUrl}/stations-within/${xyCoordsPath}`)
  },

  getStationsWithinTargetArea (taCode) {
    return util.getJson(`${serviceUrl}/stations-within-target-area/${taCode}`)
  },

  getWarningsAlertsWithinStationBuffer (rloiId) {
    return util.getJson(`${serviceUrl}/warnings-alerts-within-station-buffer/${rloiId}`)
  },

  getRiverById (id) {
    return util.getJson(`${serviceUrl}/river/${id}`)
  },

  getRiverStationByStationId (id) {
    return util.getJson(`${serviceUrl}/river-station-by-station-id/${id}`)
  },

  getRainfallStationTelemetry (id) {
    return util.getJson(`${serviceUrl}/rainfall-station-telemetry/${id}`)
  },

  getRainfallStation (id) {
    return util.getJson(`${serviceUrl}/rainfall-station/${id}`)
  },

  // direction is either 'u' or 'd'
  getStationTelemetry (id, direction) {
    return util.getJson(`${serviceUrl}/station/${id}/${direction}/telemetry`)
  },

  getStationForecastThresholds (id) {
    return util.getJson(`${serviceUrl}/station/${id}/forecast/thresholds`)
  },

  getStationForecastData (id) {
    return util.getJson(`${serviceUrl}/station/${id}/forecast/data`)
  },
  // DL: WebGL layers don't support z-index so source data needs to be in desired order, sortBy=atrisk added
  getStationsGeoJson () {
    return util.getJson(`${geoserverUrl}/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:stations&sortBy=atrisk&outputFormat=application%2Fjson`)
  },

  getRainfallGeojson () {
    return util.getJson(`${geoserverUrl}/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:rainfall_stations&outputFormat=application%2Fjson`)
  },

  getIsEngland (lng, lat) {
    return util.getJson(`${serviceUrl}/is-england/${lng}/${lat}`)
  },

  getImpactData (id) {
    return util.getJson(`${serviceUrl}/impacts/${id}`)
  },

  getImpactsWithin (bbox) {
    const xyCoordsPath = bbox.join('/')
    return util.getJson(`${serviceUrl}/impacts-within/${xyCoordsPath}`)
  },

  getRivers () {
    return util.getJson(`${serviceUrl}/rivers`)
  },

  getStationsOverview () {
    return util.getJson(`${serviceUrl}/stations-overview`)
  },

  getServiceHealth () {
    return util.getJson(serviceUrl)
  },

  getGeoserverHealth () {
    return util.getJson(`${geoserverUrl}/geoserver/flood/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert&maxFeatures=1&outputFormat=application%2Fjson`)
  },

  getStationsHealth () {
    return util.getJson(`${serviceUrl}/stations-health`)
  },

  getTelemetryHealth () {
    return util.getJson(`${serviceUrl}/telemetry-health`)
  },

  getFfoiHealth () {
    return util.getJson(`${serviceUrl}/ffoi-health`)
  },

  getTargetArea (taCode) {
    return util.getJson(`${serviceUrl}/target-area/${taCode}`)
  },

  getRiversByName (location) {
    return util.getJson(`${serviceUrl}/river-name/${location}`)
  },

  getStationsByRadius (x, y, rad = 8000) {
    const param3 = rad ? `/${rad}` : ''
    return util.getJson(`${serviceUrl}/stations-by-radius/${x}/${y}${param3}`)
  },

  getError () {
    return util.getJson(`${serviceUrl}/error`)
  }
}
