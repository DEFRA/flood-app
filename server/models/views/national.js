const moment = require('moment-timezone')
const formatDate = require('../../util').formatDate
const { bingKeyMaps } = require('../../config')

class ViewModel {
  constructor (floods, outlook) {
    Object.assign(this, {
      pageTitle: 'Flood warnings in England',
      metaDescription: 'Check the latest flood risk situation for england and the 5-day flood forecast.',
      metaKeywords: 'flooding, flood risk, flood map, flood warnings, flood alerts, river and sea levels, 5-day flood forecast, gov.uk, england',
      metaCanonical: '/national',
      hasActiveFloods: floods.hasActiveFloods,
      highestSeverityId: floods.highestSeverityId,
      dateFormatted: moment.tz('Europe/London').format('h:mma') + ' on ' + moment.tz('Europe/London').format('D MMMM YYYY'),
      dateUTC: moment().tz('Europe/London').format(),
      feedback: true,
      hasWarningsRemoved: floods._groups[3].name === 4 && floods._groups[3].count > 0,
      outlookTimestamp: formatDate(outlook._timestampOutlook, 'h:mma') + ' on ' + formatDate(outlook._timestampOutlook, 'D MMMM YYYY'),
      outlookUTC: moment(outlook._timestampOutlook).tz('Europe/London').format(),
      bingMaps: bingKeyMaps
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
        outlookTimestamp: this.outlookTimestamp,
        outlookUTC: this.outlookUTC,
        full: item.full,
        hasOutlookConcern: item.hasOutlookConcern,
        days: item.days,
        outOfDate: item.outOfDate
      }
    })[0]
  }
}

module.exports = ViewModel
