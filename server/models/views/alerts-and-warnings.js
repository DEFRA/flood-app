const { bingKeyMaps } = require('../../config')
const config = require('../../config')

class ViewModel {
  constructor ({ q, location, place, floods, station, canonical, error }) {
    Object.assign(this, {
      q: q || location,
      map: station ? 'map-station' : 'map',
      station: station,
      placeName: place?.name || '',
      placeBbox: place?.bbox2k || [],
      placeCentre: place?.center || [],
      timestamp: Date.now(),
      metaCanonical: canonical,
      canonicalUrl: canonical,
      error: error ? true : null,
      displayGetWarningsLink: true,
      displayLongTermLink: true,
      isEngland: place?.isEngland?.is_england || null,
      isDummyData: floods?.isDummyData || false,
      floodRiskUrl: config.floodRiskUrl
    })

    if (error) {
      this.pageTitle = 'Sorry, there is currently a problem searching a location'
    } else {
      if (this.station && this.station.agency_name) {
        this.pageTitle = `${this.station.agency_name} - flood alerts and warnings`
      } else {
        this.pageTitle = `${location ? location + ' - f' : 'F'}lood alerts and warnings`
      }
    }
    this.countFloods = floods ? floods.floods.length : 0
    this.floods = floods
      ? floods.groups.map(item => item)
      : []

    this.expose = {
      station: this.station,
      placeBbox: this.isEngland ? this.placeBbox : [],
      countFloods: this.countFloods,
      bingMaps: bingKeyMaps
    }
  }
}

module.exports = ViewModel
