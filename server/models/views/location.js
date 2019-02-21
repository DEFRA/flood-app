const severity = require('../severity')
const { groupBy } = require('../../util')

class ViewModel {
  constructor ({ place, floods, stations }) {
    const title = place.name

    Object.assign(this, {
      place,
      floods,
      location: title,
      pageTitle: `${title} flood risk`
    })

    // Floods
    if (floods.length) {
      const activeFloods = floods.filter(flood => flood.severity < 4)
      const hasActiveFloods = !!activeFloods.length

      const inactiveFloods = floods.filter(flood => flood.severity === 4)
      const hasInactiveFloods = !!inactiveFloods.length

      const groups = groupBy(floods, 'severity')
      const groupedFloods = Object.keys(groups).map(group => {
        return {
          floods: groups[group],
          severity: severity[group - 1]
        }
      })

      if (hasActiveFloods) {
        const summary = groupedFloods
          .filter(group => group.severity.isActive)
          .map(group => {
            const count = group.floods.length
            const groupSeverity = group.severity
            const title = count === 1
              ? groupSeverity.title
              : groupSeverity.pluralisedTitle
            const subTitle = groupSeverity.subTitle
            return { count, title, subTitle }
          })

        /*
        const statements = summary.map(item => `${item.count} ${item.title.toLowerCase()}`)
        const floodsSummaryBody = statements.reduce((accumulator, currentValue, index, arr) => {
          return `${accumulator}${(index === arr.length - 1) ? ' and' : ','} ${currentValue}`
        })
        const floodsSummary = `There ${summary[0].count === 1 ? 'is' : 'are'} currently ${floodsSummaryBody} in this area.`
        */

        // Added by Dan leech
        const floodsSummary = 'Summary'

        const highestSeverityId = Math.min(...floods.map(flood => flood.severity))

        this.highestSeverity = severity[highestSeverityId - 1]
        this.groupedFloods = groupedFloods
        this.floodsSummary = floodsSummary
      }

      this.activeFloods = activeFloods
      this.hasActiveFloods = hasActiveFloods
      this.inactiveFloods = inactiveFloods
      this.hasInactiveFloods = hasInactiveFloods
    }

    // Rivers
    if (stations.length) {
      this.rivers = groupBy(stations, 'wiski_river_name')
    }
  }
}

module.exports = ViewModel
