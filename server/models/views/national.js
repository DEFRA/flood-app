const hoek = require('hoek')
const BaseViewModel = require('.')
const severity = require('../severity')
const { groupBy } = require('../../util')

const defaults = {
  pageTitle: `Flood risk for England - GOV.UK`
}

class ViewModel extends BaseViewModel {
  constructor (options) {
    const { floods, outlook } = options
    super(hoek.applyToDefaults(defaults, options))
    const grouped = groupBy(floods, 'severity')
    this.panels = severity.map(item => {
      const group = grouped[item.id]
      const count = group ? group.length : 0
      return {
        name: item.id,
        severity: item,
        title: `${count} ${count === 1 ? item.title : item.pluralisedTitle}`,
        floods: group,
        description: item.subTitle
      }
    }) // .filter(panel => panel.floods && panel.floods.length)

    this.timestamp = Date.now()
    this.outlook = outlook
  }
}

module.exports = ViewModel
