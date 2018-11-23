const severity = require('../severity')
const { groupBy } = require('../../util')

class ViewModel {
  constructor (options) {
    const { floods, outlook } = options
    Object.assign(this, {
      pageTitle: `Flood risk for England - GOV.UK`
    }, options)

    const grouped = groupBy(floods, 'severity')
    this.groups = severity.map(item => {
      const group = grouped[item.id]
      const count = group ? group.length : 0
      return {
        name: item.id,
        severity: item,
        title: `${count} ${count === 1 ? item.title : item.pluralisedTitle}`,
        floods: group,
        description: item.subTitle
      }
    })

    this.timestamp = Date.now()
    this.floods = floods
    this.outlook = outlook
  }
}

module.exports = ViewModel
