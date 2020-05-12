const severity = require('../severity')

class ViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity.filter(item => {
      return item.id === flood.severity_value
    })[0]

    const type = area.code.charAt(4).toLowerCase() === 'w'
      ? 'warning'
      : 'alert'

    let pageTitle

    if (severityLevel) {
      if (severityLevel.isActive) {
        pageTitle = severityLevel.title + ' for ' + area.name
      }
      if (!severityLevel.isActive || severityLevel.hash === 'removed') {
        pageTitle = `${area.name} flood ${type} area`
      }
    } else {
      pageTitle = `${area.name} flood ${type} area`
    }
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
