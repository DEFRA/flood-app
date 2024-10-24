const severity = require('../severity')
const moment = require('moment-timezone')
const { bingKeyMaps, floodRiskUrl } = require('../../config')
const getThresholdsForTargetArea = require('./lib/latest-levels')

class ViewModel {
  constructor (options) {
    const { area, flood, parentFlood, thresholds } = options

    const severityLevel = flood && severity.filter(item => item.id === flood.severity_value)[0]
    const parentSeverityLevel = parentFlood && severity.filter(item => item.id === parentFlood.severity_value)[0]

    const type = area.code.charAt(4).toLowerCase() === 'w' ? 'warning' : 'alert'

    const fallbackText = getFallbackText(type)
    let situation = fallbackText

    if (flood?.situation) {
      flood.situation = flood.situation.trim()
      situation = messageValidator(flood.situation)
    }

    const dateSituationChanged = flood
      ? moment.tz(flood.situation_changed, 'Europe/London').format('D MMMM YYYY')
      : moment.tz('Europe/London').format('D MMMM YYYY')

    const timeSituationChanged = flood
      ? moment.tz(flood.situation_changed, 'Europe/London').format('h:mma')
      : moment.tz('Europe/London').format('h:mma')

    area.description = area.description.trim()
    const description = area.description.endsWith('.') ? area.description.slice(0, -1) : area.description

    const areaDescription = `Flood ${type} area: ${description}.`
    const metaDescription = `Flooding information and advice for the area: ${description}.`

    const parentAreaAlert = (!!(((flood && severityLevel.id === 4) && (type === 'warning')) || !flood) && (parentSeverityLevel?.isActive))

    const situationChanged = getSituationChangedText(flood, severityLevel, timeSituationChanged, dateSituationChanged)

    const pageTitle = severityLevel?.isActive
      ? `${severityLevel.title} for ${area.name}`
      : `${area.name} flood ${type} area`

    const metaCanonical = `/target-area/${area.code}`

    const latestLevels = thresholds ? getThresholdsForTargetArea(thresholds) : null

    Object.assign(this, {
      pageTitle,
      metaDescription,
      metaCanonical,
      mapButtonText: `View map of the flood ${type} area`,
      latestLevels,
      placeName: area.name,
      placeCentre: JSON.parse(area.centroid).coordinates,
      featureId: area.id,
      severity: severityLevel,
      situationChanged,
      situation,
      parentAreaAlert,
      areaDescription,
      targetArea: area.code,
      feedback: false,
      floodRiskUrl,
      bingMaps: bingKeyMaps,
      signUpForFloodWarnings: true,
      displayLongTermLink: true
    }, options)
  }
}

function getFallbackText (type) {
  if (type === 'alert') {
    return '<p>We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.</p>'
  } else {
    return '<p>We\'ll update this page when there\'s a flood warning in the area.</p><p>A flood warning means flooding to some property is expected. A severe flood warning means there\'s a danger to life.</p>'
  }
}

function getSituationChangedText (flood, severityLevel, timeSituationChanged, dateSituationChanged) {
  if (severityLevel?.id === 4) {
    return `Removed ${timeSituationChanged} on ${dateSituationChanged}`
  }
  return flood
    ? `Updated ${timeSituationChanged} on ${dateSituationChanged}`
    : `Up to date as of ${timeSituationChanged} on ${dateSituationChanged}`
}

function messageValidator (message) {
  const strippedMessage = message.replace(/(\r?\n)+/g, '\n')
  return strippedMessage.split('\n').map(p => `<p>${p}</p>`).join(' ')
}

module.exports = ViewModel
