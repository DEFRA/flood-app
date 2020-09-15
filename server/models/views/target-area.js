const severity = require('../severity')
const moment = require('moment-timezone')

class ViewModel {
  constructor (options) {
    const { area, flood, parentFlood } = options
    const severityLevel = flood && severity.filter(item => {
      return item.id === flood.severity_value
    })[0]
    const parentSeverityLevel = parentFlood && severity.filter(item => {
      return item.id === parentFlood.severity_value
    })[0]

    const type = area.code.charAt(4).toLowerCase() === 'w'
      ? 'warning'
      : 'alert'

    const mapTitle = `View map of the flood ${type} area`

    let fallbackText
    if (type === 'alert') {
      fallbackText = '<p>We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.</p>'
    } else {
      fallbackText = '<p>We\'ll update this page when there\'s a flood warning in the area.</p><p>A flood warning means flooding to some property is expected. A severe flood warning means there\'s a danger to life.</p>'
    }

    const situation = flood && flood.situation !== '' ? `<p>${flood.situation}</p>` : fallbackText

    const dateSituationChanged = flood
      ? moment.tz(flood.situation_changed, 'Europe/London').format('D MMMM YYYY')
      : moment.tz('Europe/London').format('D MMMM YYYY')

    const timeSituationChanged = flood
      ? moment.tz(flood.situation_changed, 'Europe/London').format('h:mma')
      : moment.tz('Europe/London').format('h:mma')

    const areaDescription = `Flood ${type} area: ${area.description}`
    const parentAreaAlert = (!!(((flood && severityLevel.id === 4) && (type === 'warning')) || !flood) && (parentSeverityLevel && parentSeverityLevel.isActive))

    let situationChanged = flood
      ? `Updated ${timeSituationChanged} on ${dateSituationChanged}`
      : `Up to date as of ${timeSituationChanged} on ${dateSituationChanged}`
    if (flood && severityLevel.id === 4) {
      situationChanged = `Removed ${timeSituationChanged} on ${dateSituationChanged}`
    }

    const pageTitle = (severityLevel && severityLevel.isActive ? severityLevel.title + ' for ' + area.name : `${area.name} flood ${type} area`)
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
      parentAreaAlert: parentAreaAlert,
      areaDescription: areaDescription,
      targetArea: area.code,
      feedback: true,
      mapTitle
    }, options)
  }
}

module.exports = ViewModel
