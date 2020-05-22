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

    let situation = flood ? flood.situation : ''

    const dateSituationChanged = flood ? moment.tz(flood.situation_changed, 'Europe/London').format('D MMMM YYYY') : moment.tz('Europe/London').format('D MMMM YYYY')
    const timeSituationChanged = flood ? moment.tz(flood.situation_changed, 'Europe/London').format('h:ma') : moment.tz('Europe/London').format('h:ma')

    const situationChanged = `Up to date as of ${timeSituationChanged} on ${dateSituationChanged}`

    const pageTitle = (severityLevel && severityLevel.isActive ? severityLevel.title + ' for ' + area.name : `${area.name} flood ${type} area`)
    if (severityLevel && !severityLevel.isActive) {
      if (type === 'warning') {
        situation = 'This is an area where we issue a flood warning. We\'ll update this page if the warning is in place. A flood warning means flooding to some property is expected.'
      } else {
        situation = 'This is an area where we issue a flood alert. We\'ll update this page if the alert is in place. A flood alert means flooding to low lying land is possible.'
      }
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
      situation: situation,
      mapTitle
    }, options)
  }
}

module.exports = ViewModel
