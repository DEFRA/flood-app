class ViewModel {
  constructor ({ location, place, impacts }) {
    Object.assign(this, {
      q: location,
      pageTitle: `${place.name} historic flood impacts`,
      metaNoIndex: true,
      placeName: place.name,
      placeBbox: place.bbox,
      placeCentre: place.center
    })

    impacts.sort((a, b) => b.value - a.value)
    const activeImpacts = impacts.filter(active => active.telemetryactive === true)
    this.countActiveImpacts = activeImpacts.length
    this.activeImpacts = activeImpacts
  }
}

module.exports = ViewModel
