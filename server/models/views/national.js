const severity = require('../severity')
const processOutlookData = require('../outlook')
const { groupBy } = require('../../util')

class ViewModel {
  constructor (options) {
    const { floods, outlook } = options
    Object.assign(this, {
      pageTitle: `Flood risk for England`
    }, options)

    // Floods
    const grouped = groupBy(floods, 'severity')
    this.groups = severity.map(item => {
      const group = grouped[item.id]
      const count = group ? group.length : 0
      return {
        id: item.id,
        name: item.name,
        severity: item,
        count: count,
        title: `${count} ${count === 1 ? item.title : item.pluralisedTitle}`,
        floods: group,
        description: item.subTitle
      }
    })

    // Outlook
    const data = processOutlookData(outlook)
    const issueDate = new Date(outlook.issued_at)
    const date = issueDate.getDate()
    const days = [0, 1, 2, 3, 4].map(i => {
      return {
        idx: i + 1,
        level: data.riskLevels[i],
        date: new Date(issueDate.setDate(date + i))
      }
    })

    this.days = days
    this.hasOutlookConcern = data.hasOutlookConcern
    this.timestampOutlook = data.timestampOutlook
    this.geoJson = data.geoJson
    this.timestamp = Date.now()
    this.floods = floods
    // this.outlook = data.full
    this.outlook = data.headline
  }
}

module.exports = ViewModel
