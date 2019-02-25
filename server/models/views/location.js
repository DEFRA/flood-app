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

      var primaryGroup = []
      if (hasActiveFloods) { // alert, warning or severe
        
        /*
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

        const statements = summary.map(item => `${item.count} ${item.title.toLowerCase()}`)
        const floodsSummaryBody = statements.reduce((accumulator, currentValue, index, arr) => {
          return `${accumulator}${(index === arr.length - 1) ? ' and' : ','} ${currentValue}`
        })
        const floodsSummary = `There ${summary[0].count === 1 ? 'is' : 'are'} currently ${floodsSummaryBody} in this area.`
        */

        const highestSeverityId = Math.min(...floods.map(flood => flood.severity))
        const highestSeverity = severity[highestSeverityId - 1]

        // Primary message
        var floodsPrimary = ''
        primaryGroup = groupedFloods[0].floods
        var primaryList = primaryGroup.map((flood, i) => {
          return `${primaryGroup.length > 1 && primaryGroup.length === (i + 1) ? 'and' : ''}${i > 0 && i < primaryGroup.length + 1 ? ',' : ''}${primaryGroup.length > 0 ? `<a href="/target-area/${primaryGroup[i].code}">${primaryGroup[i].description}</a>` : ''}`
        }).join(' ')

        switch(highestSeverity.name) {
          case 'severe':
            floodsPrimary = `
            <p>
              ${primaryGroup.length > 1 ? primaryGroup.length + ' ' : 'A '}severe flood warning${primaryGroup.length > 1 ? primaryGroup.length + 's are' : ' is'} in force ${primaryGroup.length > 2 ? '' : 'for ' + primaryList} where there is a danger to life.
              <a href="/what-to-do-in-a-flood/getting-a-severe-flood-warning">You must act now</a> if you live in ${primaryGroup.length > 1 ? primaryGroup.length + 'one of these areas' : 'this area'}.
            </p>
            `
            break
          case 'warning':
            floodsPrimary = `
            <p>
              ${primaryGroup.length > 1 ? primaryGroup.length + ' ' : 'A '}flood warning${primaryGroup.length > 1 ? primaryGroup.length + 's are' : ' is'} in force ${primaryGroup.length > 2 ? '' : 'for ' + primaryList} where flooding is expected.
              You need to <a href="/what-to-do-in-a-flood/getting-a-flood-warning">take action</a> if you live in ${primaryGroup.length > 1 ? primaryGroup.length + 'one of these areas' : 'this area'}.
            </p>
            `
            break
          case 'alert':
            floodsPrimary = `
            <p>
              ${primaryGroup.length > 1 ? primaryGroup.length + ' ' : 'A '}flood alert${primaryGroup.length > 1 ? primaryGroup.length + 's are' : ' is'} in place ${primaryGroup.length > 2 ? '' : 'for ' + primaryList}.
              There may be some flooding, <a href="/what-to-do-in-a-flood/getting-a-flood-alert">be prepared</a> if you live in ${primaryGroup.length > 1 ? 'one of these areas' : 'this area'}.
            </p>
            `
            break
        }

        this.highestSeverity = highestSeverity
        this.groupedFloods = groupedFloods
        this.floodsSummary = floodsPrimary
      }

      this.hasAllFloodsList = floods.length > primaryGroup.length || floods.length > 2 ? true : false
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
