class ViewModel {
  constructor ({ location, place, floods }) {
    const placeName = place ? place.name : ''
    const placeBbox = place ? place.bbox : []
    const placeCentre = place ? place.center : []
    const pageTitle = `${placeName ? placeName + ' f' : 'F'}lood alerts and warnings`

    Object.assign(this, {
      q: location,
      pageTitle: pageTitle,
      placeName: placeName,
      placeBbox: placeBbox,
      placeCentre: placeCentre
    })

    const inactiveFloods = floods.floods.filter(flood => flood.severity === 4)

    this.countFloods = floods.floods.length
    this.countInactiveFloods = inactiveFloods.length
    this.floods = floods.groups
    this.timestamp = Date.now()
  }
}

module.exports = ViewModel
