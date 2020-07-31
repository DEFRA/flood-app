const util = require('../util')
const { serviceUrl, geoserverUrl } = require('../config')

// cached flood data
const Floods = require('../models/floods')
const Outlook = require('../models/outlook')
let floods = null
let outlook = null
let stationsGeojson = null

module.exports = {
  // ############ Internals ################
  // get cached floods object
  get floods () {
    return floods
  },
  // set the cached floods object
  set floods (data) {
    floods = data && new Floods(data)
  },
  // get cached outlook object
  get outlook () {
    return outlook
  },
  // set cached outlook object
  set outlook (data) {
    outlook = data && new Outlook(data)
  },

  get stationsGeojson () {
    return stationsGeojson
  },

  set stationsGeojson (data) {
    stationsGeojson = data
  },

  // ############### Externals ################

  // get floods from service (should only be used by serverside scheduled job)
  getFloods () {
    return util.getJson(`${serviceUrl}/floods`)
  },

  getFloodsWithin (bbox) {
    return util.getJson(`${serviceUrl}/floods-within/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`)
  },

  getFloodArea (code) {
    // 5th character of code states "w" or "a"
    // for warning or alert flood area types
    const type = code.charAt(4).toLowerCase() === 'w'
      ? 'warning'
      : 'alert'

    return util.getJson(`${serviceUrl}/flood-area/${type}/${code}`)
  },

  getOutlook () {
    return util.getJson(`${serviceUrl}/flood-guidance-statement`)
  },

  getStationById (id, direction) {
    return util.getJson(`${serviceUrl}/station/${id}/${direction}`)
  },

  getStationsWithin (bbox) {
    return util.getJson(`${serviceUrl}/stations-within/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`)
  },

  getStationsWithinTargetArea (taCode) {
    return util.getJson(`${serviceUrl}/stations-within-target-area/${taCode}`)
  },

  getWarningsAlertsWithinStationBuffer (longLat) {
    const long = longLat[0]
    const lat = longLat[1]
    return util.getJson(`${serviceUrl}/warnings-alerts-within-station-buffer/${long}/${lat}`)
  },

  getRiverById (id) {
    return util.getJson(`${serviceUrl}/river/${id}`)
  },

  getRiverStationByStationId (id) {
    return util.getJson(`${serviceUrl}/river-station-by-station-id/${id}`)
  },

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

  getIsEngland (lng, lat) {
    return util.getJson(`${serviceUrl}/is-england/${lng}/${lat}`)
  },

  getImpactData (id) {
    return util.getJson(`${serviceUrl}/impacts/${id}`)
  },

  getImpactsWithin (bbox) {
    return util.getJson(`${serviceUrl}/impacts-within/${bbox[0]}/${bbox[1]}/${bbox[2]}/${bbox[3]}`)
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
  }
}
