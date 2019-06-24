const severity = require('../severity')

class ViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity[flood.severity - 1]
    var targetAreaState = severityLevel ? severity[flood.severity - 1].title.toLowerCase() : 'target area'

    Object.assign(this, {
      pageTitle: `${area.name} ${targetAreaState}`,
      severity: severityLevel,
      place: {
        name: area.name,
        center: JSON.parse(area.centroid).coordinates
      }
    }, options)
  }
}

module.exports = ViewModel
