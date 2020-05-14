const severity = require('../severity')
const moment = require('moment-timezone')

class ViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity.filter(item => {
      return item.id === flood.severity_value
    })[0]

    const type = area.code.charAt(4).toLowerCase() === 'w'
      ? 'warning'
      : 'alert'

    const mapTitle = `View map of the flood ${type} area`

    let situationChanged

    if (flood) {
      const dateSituationChanged = moment.tz(flood.situation_changed, 'Europe/London').format('D MMMM YYYY')
      const timeSituationChanged = moment.tz(flood.situation_changed, 'Europe/London').format('h:ma')

      situationChanged = `Updated ${timeSituationChanged} on ${dateSituationChanged}`
    }

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
      severity: severityLevel,
      situationChanged,
      mapTitle
    }, options)
  }
}

module.exports = ViewModel
