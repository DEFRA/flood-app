const severity = require('../severity')

class ViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity[flood.severity - 1]
    var pageTitle = severityLevel ? severity[flood.severity - 1].title + ': ' + area.name : area.name + ' flood risk area'

    Object.assign(this, {
      pageTitle: pageTitle,
      severity: severityLevel,
      place: {
        name: area.name,
        center: JSON.parse(area.centroid).coordinates
      }
    }, options)
  }
}

module.exports = ViewModel
