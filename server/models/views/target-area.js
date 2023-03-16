const severity = require('../severity')
const moment = require('moment-timezone')
const twitLink = require('../targetAreaTwitter')
const { bingKeyMaps, floodRiskUrl } = require('../../config')

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

    const eaTwitter = twitLink.find(t => t.area === area.area)

    let situation = fallbackText
    if (flood && flood.situation) {
      const message = flood.situation.endsWith('.') ? flood.situation.slice(0, -1) : flood.situation
      situation = `<p>${message}. Follow <a class="govuk-link" href="https://twitter.com/${eaTwitter.link}">@${eaTwitter.link}</a> on Twitter for the latest information in your area.</p>`
    }

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
    const metaDescription = `Flooding information and advice for the area: ${area.description}.`
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
      feedback: false,
      mapTitle,
      floodRiskUrl,
      bingMaps: bingKeyMaps,
      planAhead: 'Target Area:Related-content:Plan-ahead-for-flooding',
      whatToDo: 'Target Area:Related-content:What-to-do-in-a-flood',
      recoverAfter: 'Target Area:Related-content:Recover-after-a-flood',
      longTerm: 'Target Area:Related-content:Check-long-term-risk',
      reportFlood: 'Target Area:Related-content:Report-a-flood',
      twitterEvent: 'Target Area:Share Page:TA - Share to Twitter',
      facebookEvent: 'Target Area:Share Page:TA - Share to Facebook',
      emailEvent: 'Target Area:Share Page:TA - Share to email'
    }, options)
  }
}

module.exports = ViewModel
