const severity = require('../models/severity')
const { groupBy } = require('../util')

class Floods {
  constructor (data) {
    this._floods = data
    const grouped = groupBy(this._floods.floods, 'severity')
    this._groups = severity.map(item => {
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
  }
  get floods () {
    return this._floods.floods
  }
  get timestamp () {
    return this._floods.timestamp
  }
  get groups () {
    return this._groups
  }
}
module.exports = Floods
