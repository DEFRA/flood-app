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
      const severeFloods = floods.filter(flood => flood.severity === 1)
      const warningFloods = floods.filter(flood => flood.severity === 2)
      const alertFloods = floods.filter(flood => flood.severity === 3)
      const inactiveFloods = floods.filter(flood => flood.severity === 4)

      const hasActiveFloods = !!activeFloods.length
      // const hasSevereFloods = !!severeFloods.length
      // const hasWarningFloods = !!warningFloods.length
      // const hasAlertFloods = !!alertFloods.length
      const hasInactiveFloods = !!inactiveFloods.length
      const groups = groupBy(floods, 'severity')
      const groupedFloods = Object.keys(groups).map(group => {
        return {
          floods: groups[group],
          severity: severity[group - 1]
        }
      })

      const highestSeverityId = Math.min(...floods.map(flood => flood.severity))
      const highestSeverity = severity[highestSeverityId - 1]

      const primaryGroup = groupedFloods[0].floods
      const primaryList = primaryGroup.map((flood, i) => {
        return `${primaryGroup.length > 1 && i === primaryGroup.length - 1 ? 'and ' : ''}${primaryGroup.length > 0 ? `<a href="/target-area/${primaryGroup[i].code}">${primaryGroup[i].description}</a>` : ''}`
      }).join(' ')

      // Primary statement (first sentence)
      var primaryStatement = ''
      if (hasActiveFloods) { // alert, warning or severe
        switch (highestSeverity.name) {
          case 'severe':
            primaryStatement = `
              ${primaryGroup.length > 1 ? primaryGroup.length : 'A'} severe flood warning${primaryGroup.length > 1 ? 's are' : ' is'} in force ${primaryGroup.length > 2 ? '' : 'for ' + primaryList} where there is a danger to life.
              <a href="/what-to-do-in-a-flood/getting-a-severe-flood-warning">You must act now</a> if you live in ${primaryGroup.length > 1 ? 'one of these areas' : 'this area'}.
            `
            break
          case 'warning':
            primaryStatement = `
              ${primaryGroup.length > 1 ? primaryGroup.length : 'A'} flood warning${primaryGroup.length > 1 ? 's are' : ' is'} in force ${primaryGroup.length > 2 ? '' : 'for ' + primaryList} where flooding is expected.
              You need to <a href="/what-to-do-in-a-flood/getting-a-flood-warning">take action</a> if you live in ${primaryGroup.length > 1 ? 'one of these areas' : 'this area'}.
            `
            break
          case 'alert':
            primaryStatement = `
              ${primaryGroup.length > 1 ? primaryGroup.length : 'A'} flood alert${primaryGroup.length > 1 ? 's are' : ' is'} in place ${primaryGroup.length > 2 ? '' : 'for ' + primaryList} where some flooding is possible.
              <a href="/what-to-do-in-a-flood/getting-a-flood-alert">Be prepared</a> if you live in ${primaryGroup.length > 1 ? 'one of these areas' : 'this area'}.
            `
            break
        }
      }

      // Secondary statement (optional)
      var secondaryStatement = ''
      if (floods.length > primaryGroup.length || floods.length > 2) {
        if (warningFloods.length && severeFloods.length) {
          secondaryStatement += `
            ${warningFloods.length} flood warning${warningFloods.length > 1 ? 's (flooding is expected) are' : ' (flooding is expected) is'} also in force ${alertFloods.length ? 'and' : '.'}
          `
        }
        if (alertFloods.length && (severeFloods.length || warningFloods.length)) {
          secondaryStatement += `
            ${alertFloods.length} flood alert${alertFloods.length > 1 ? 's (some flooding is possible) are' : ' (some flooding is possible) is'} ${!!severeFloods.length && !!warningFloods.length ? 'also' : ''} in place in the wider area.
          `
        }
      }

      // Inactive floods (optional)
      var inactiveStatement = ''
      if (hasInactiveFloods) {
        if (inactiveFloods.length > 2 || hasActiveFloods) {
          inactiveStatement = `
            ${inactiveFloods.length} flood warning${inactiveFloods.length > 1 ? 's have' : ' has'} been removed.
          `
        } else {
          inactiveStatement = `
            ${primaryGroup.length > 1 ? 'Flood warnings' : 'The flood warning'} for ${primaryList} ${primaryGroup.length > 1 ? 'have' : 'has'} been removed.
          `
        }
      }

      this.highestSeverity = highestSeverity
      this.groupedFloods = groupedFloods
      this.floodsPrimary = primaryStatement
      this.floodsSecondary = secondaryStatement + inactiveStatement
      this.hasFloodsSecondary = this.floodsSecondary.length ? true : false
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
