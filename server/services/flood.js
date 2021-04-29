const util = require('../util')
const { serviceUrl, geoserverUrl } = require('../config')

// cached flood data
const Floods = require('../models/floods')
const Outlook = require('../models/outlook')
let floods = null
let outlook = null
let stationsGeojson = null
let rainfallGeojson = null

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
    try {
      return outlook
    } catch (err) {
      console.error(`Get Outlook data error - [${err}]`)
      return { dataError: true }
    }
  },
  // set cached outlook object
  set outlook (data) {
    if (data.dataError) {
      console.error('Set Outlook data error encountered: ', data)
    } else {
      try {
        const newData = new Outlook(data)
        if (newData.dataError) {
          console.error('Set Outlook data error encountered: ', newData)
        } else {
          outlook = data && new Outlook(data)
        }
      } catch (err) {
        console.error(`Set Outlook cached data error - [${err}]`)
        outlook = { dataError: true }
      }
    }
  },

  get stationsGeojson () {
    return stationsGeojson
  },

  set stationsGeojson (data) {
    stationsGeojson = data
  },

  get rainfallGeojson () {
    return rainfallGeojson
  },

  set rainfallGeojson (data) {
    rainfallGeojson = data
  },

  // ############### Externals ################

  // get floods from service (should only be used by serverside scheduled job)
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
  async getOutlook () {
    try {
      return await util.getJson(`${serviceUrl}/flood-guidance-statement`)
    } catch (err) {
      console.error(`Get Outlook data error - [${err}]`)
      return { dataError: true }
    }
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

  getStationsByRadius (x, y) {
    return util.getJson(`${serviceUrl}/stations-by-radius/${x}/${y}`)
  }
}
