const { bingKeyMaps } = require('../../config')

class ViewModel {
  constructor ({ location, place, floods, station, error }) {
    Object.assign(this, {
      q: location,
      map: station ? 'map-station' : 'map',
      station: station || null,
      placeName: place ? place.name : '',
      placeBbox: place ? place.bbox2k : [],
      placeCentre: place ? place.center : [],
      timestamp: Date.now(),
      error: error ? true : null,
      isEngland: place ? place.isEngland.is_england : null,
      isDummyData: floods ? floods.isDummyData : false
    })

    if (error) {
      this.pageTitle = 'Sorry, there is currently a problem searching a location'
    } else {
      if (this.station && this.station.agency_name) {
        this.pageTitle = `${this.station.agency_name} - flood alerts and warnings`
      } else {
        this.pageTitle = `${location ? location + ' f' : 'F'}lood alerts and warnings`
      }
    }
    this.countFloods = floods ? floods.floods.length : 0
    this.floods = floods
      ? floods.groups.map(item => item)
      : []

    this.expose = {
      station: this.station,
      placeBbox: this.placeBbox,
      countFloods: this.countFloods,
      bingMaps: bingKeyMaps
    }
  }
}

module.exports = ViewModel
