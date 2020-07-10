class ViewModel {
  constructor ({ location, place, floods, station, error }) {
    Object.assign(this, {
      q: location,
      map: station ? 'map-station' : 'map',
      station: station || null,
      metaNoIndex: true,
      placeName: place ? place.name : '',
      placeBbox: place ? place.bbox : [],
      placeCentre: place ? place.center : [],
      timestamp: Date.now(),
      error: error ? true : null,
      isEngland: place ? place.isEngland.is_england : null
    })

    if (error) {
      this.pageTitle = 'Sorry, there is currently a problem searching a location'
    } else {
      if (this.station && this.station.agency_name) {
        this.pageTitle = `${this.station.agency_name} - flood alerts and warnings`
      } else {
        this.pageTitle = `${this.placeName ? this.placeName + ' f' : 'F'}lood alerts and warnings`
      }
    }
    this.countFloods = floods ? floods.floods.length : 0
    this.floods = floods ? floods.groups.map(item => {
      return item
    }) : []

    this.expose = {
      station: this.station,
      placeBbox: this.placeBbox,
      countFloods: this.countFloods
    }
  }
}

module.exports = ViewModel
