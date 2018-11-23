const severity = require('../severity')

class ViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity[flood.severity - 1]

    Object.assign(this, {
      pageTitle: `Flood information for ${area.description} - GOV.UK`,
      severity: severityLevel,
      place: {
        name: area.name,
        center: JSON.parse(area.centroid).coordinates
      }
    }, options)
  }
}

module.exports = ViewModel
