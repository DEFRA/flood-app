const moment = require('moment-timezone')

class ViewModel {
  constructor (floods, outlook) {
    Object.assign(this, {
      pageTitle: 'Flood warnings in England',
      metaDescription: 'Check the latest flood risk situation for england and the 5-day flood forecast.',
      metaKeywords: 'flooding, flood risk, flood map, flood warnings, flood alerts, river and sea levels, 5-day flood forecast, gov.uk, england',
      metaCanonical: '/national',
      hasActiveFloods: floods.hasActiveFloods,
      highestSeverityId: floods.highestSeverityId,
      dateFormatted: 'Updated ' + moment.tz('Europe/London').format('h:mma') + ' on ' + moment.tz('Europe/London').format('D MMMM YYYY'),
      feedback: true,
      hasWarningsRemoved: floods._groups[3].name === 4 && floods._groups[3].count > 0,
      timestampOutlook: 'Updated at ' + moment(outlook._timestampOutlook).tz('Europe/London').format('h:mma') + ' on ' + moment(outlook._timestampOutlook).tz('Europe/London').format('D MMMM YYYY')
    })

    // Strip out flood array as it is superflous to the view
    this.floods = floods.groups.map(item => {
      return {
        count: item.count,
        description: item.description,
        name: item.name,
        severity: item.severity,
        title: item.title
      }
    })
    // Strip out superflous outlook data
    this.outlook = [outlook].map(item => {
      return {
        timestampOutlook: this.timestampOutlook,
        full: item.full,
        hasOutlookConcern: item.hasOutlookConcern,
        days: item.days
      }
    })[0]
  }
}

module.exports = ViewModel
