class ViewModel {
  constructor ({ location, place, floods, error }) {
    Object.assign(this, {
      q: location,
      metaNoIndex: true,
      placeName: place ? place.name : '',
      placeBbox: place ? place.bbox : [],
      placeCentre: place ? place.center : [],
      timestamp: Date.now(),
      error
    })

    if (error) {
      this.pageTitle = 'Sorry, there is currently a problem searching a location'
    } else {
      this.pageTitle = `${this.placeName ? this.placeName + ' f' : 'F'}lood alerts and warnings`
    }
    this.countFloods = floods ? floods.floods.length : 0
    this.floods = floods ? floods.groups.map(item => {
      return item
    }) : []

    this.expose = {
      placeBbox: this.placeBbox,
      countFloods: this.countFloods
    }
  }
}

module.exports = ViewModel
