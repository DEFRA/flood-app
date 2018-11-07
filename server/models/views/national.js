const hoek = require('hoek')
const BaseViewModel = require('.')
const severity = require('../severity')

const defaults = {
  pageTitle: `Flood risk for England - GOV.UK`,
  serviceName: 'Flood Information Service',
  metadata: {
    keywords: '...',
    description: '...'
  }
}

function groupBy (arr, prop) {
  return arr.reduce(function (groups, item) {
    const val = item[prop]
    groups[val] = groups[val] || []
    groups[val].push(item)
    return groups
  }, {})
}

class ViewModel extends BaseViewModel {
  constructor (options) {
    const { floods } = options
    super(hoek.applyToDefaults(defaults, options))
    const grouped = groupBy(floods, 'severity')
    this.panels = Object.keys(severity).map(key => {
      const item = severity[key]
      const group = grouped[item.id]
      const count = group ? group.length : 0
      return {
        name: key.toLowerCase(),
        title: `${count} ${count === 1 ? item.title : item.pluralisedTitle}`.toLowerCase(),
        floods: group,
        description: item.subTitle
      }
    }).filter(panel => panel.floods && panel.floods.length)
  }
}

module.exports = ViewModel
