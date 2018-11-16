const hoek = require('hoek')
const BaseViewModel = require('./')
const severity = require('../severity')
const { groupBy } = require('../../util')

const defaults = {
  metadata: {
    keywords: '...',
    description: '...'
  }
}

class ViewModel extends BaseViewModel { // Inherit from National for now, Base eventually
  constructor ({ place, floods, stations }) {
    const title = place.name

    super(hoek.applyToDefaults(defaults, {
      place,
      floods,
      location: title,
      pageTitle: `${title} flood risk - GOV.UK`
    }))

    // Floods
    if (floods.length) {
      const activeFloods = floods.filter(flood => flood.severity < 4)

      if (activeFloods.length) {
        // Primary
        const primarySeverityId = Math.min(...activeFloods.map(flood => flood.severity))
        const primaryFloods = activeFloods.filter(flood => flood.severity === primarySeverityId)

        this.primaryFloods = primaryFloods
        this.primarySeverity = severity[primarySeverityId - 1]

        // Secondary
        const secondaryFloods = floods.filter(flood => flood.severity !== primarySeverityId)
        const secondarySeverities = [...new Set(secondaryFloods.map(flood => flood.severity))]

        this.secondaryFloods = secondaryFloods
        this.hasSecondaryFloods = !!secondaryFloods.length
        this.secondaryGroups = secondarySeverities.map(id => {
          return {
            severity: severity[id - 1],
            floods: secondaryFloods.filter(flood => flood.severity === id)
          }
        })

        const activeSecondaryGroups = this.secondaryGroups
          .filter(group => group.severity.id !== 4)
          .sort((a, b) => a.severity.id < b.severity.id ? -1 : 1)

        this.activeSecondaryGroups = activeSecondaryGroups
        this.hasActiveSecondaryFloods = !!activeSecondaryGroups.length

        if (this.hasActiveSecondaryFloods) {
          // There will only ever be, at most, 2 `activeSecondaryGroups`:
          // "flood warnings" and/or "flood alerts". A simple array join
          // on the string ' and ' will do.
          this.secondaryMessage = activeSecondaryGroups
            .map(group => {
              const count = group.floods.length
              const title = count === 1
                ? group.severity.title
                : group.severity.pluralisedTitle
              const subTitle = group.severity.subTitle
              return `${count} ${title.toLowerCase()} (${subTitle.toLowerCase()})`
            })
            .join(' and ') + ' also in force.'
        }
      }

      // Expired floods
      const inactiveFloods = floods.filter(flood => flood.severity === 4)
      this.inactiveFloods = inactiveFloods
      this.hasInactiveFloods = !!inactiveFloods.length

      if (this.hasInactiveFloods) {
        const count = inactiveFloods.length
        const expiredSeverity = severity[3]
        const expiredTitle = count === 1
          ? expiredSeverity.title
          : expiredSeverity.pluralisedTitle
        this.expiredSeverity = expiredSeverity
        this.expiredMessage = `${count} ${expiredTitle.toLowerCase()}.`
      }
    }

    // Rivers
    if (stations.length) {
      this.rivers = groupBy(stations, 'wiski_river_name')
    }
  }
}

module.exports = ViewModel
