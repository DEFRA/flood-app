const severity = require('../severity')

class ViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity.filter(item => {
      return item.id === flood.severity_value
    })[0]
    const pageTitle = severityLevel ? severityLevel.title + ': ' + area.name : 'Flood risk target area: ' + area.name
    const metaDescription = `Advice and guidance for residents living in the flood risk area: ${area.description}.`
    const metaCanonical = `/target-area/${area.code}`

    Object.assign(this, {
      pageTitle: pageTitle,
      metaDescription: metaDescription,
      metaCanonical: metaCanonical,
      placeName: area.name,
      placeCentre: JSON.parse(area.centroid).coordinates,
      featureId: area.id,
      severity: severityLevel
    }, options)
  }
}

module.exports = ViewModel
