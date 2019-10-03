const moment = require('moment-timezone')

class ViewModel {
  constructor ({ location, place, impacts }) {

    Object.assign(this, {
      q: location,
      placeName: place.name,
      pageTitle: `${place.name} historic flood impacts`
    })

    // Impacts
    // sort impacts order by value
    impacts.sort((a, b) => b.value - a.value)
    // create an array of all active impacts
    this.activeImpacts = impacts.filter(active => active.telemetryactive === true)
    this.hasActiveImpacts = !!this.activeImpacts.length
  }
}

module.exports = ViewModel
