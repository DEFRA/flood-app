const severity = require('../severity')

class ViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity[flood.severity - 1]
    var pageTitle = severityLevel ? severity[flood.severity - 1].title + ': ' + area.name : area.name + ' flood risk area'

    Object.assign(this, {
      pageTitle: pageTitle,
      placeName: area.name,
      placeCentre: JSON.parse(area.centroid).coordinates,
      severity: severityLevel
    }, options)
  }
}

module.exports = ViewModel
