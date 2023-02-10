const moment = require('moment-timezone')
const formatDate = require('../../util').formatDate
const { bingKeyMaps, floodRiskUrl } = require('../../config')
const tz = 'Europe/London'

class ViewModel {
  constructor (floods, outlook) {
    const now = moment().tz(tz).valueOf()
    if (!outlook) {
      outlook = { _timestampOutlook: now, dataError: true }
    }
    // Check if flood guidance statement is older than 48 hours
    const issueDate = moment(outlook._timestampOutlook).valueOf()
    const hours48 = 2 * 60 * 60 * 24 * 1000
    const outlookOutOfDate = (now - issueDate) > hours48

    Object.assign(this, {
      outlookOutOfDate,
      floodRiskUrl,
      pageTitle: 'Check for flooding in England',
      metaDescription:
        'View current flood warnings and alerts for England and the national flood forecast for the next 5 days. Also check river, sea, groundwater and rainfall levels.',
      metaCanonical: '/',
      hasActiveFloods: floods.hasActiveFloods,
      highestSeverityId: floods.highestSeverityId,
      dateFormatted: `${moment().tz(tz).format('h:mma')} on ${moment().tz(tz).format('D MMMM YYYY')}`,
      dateUTC: moment().tz(tz).format(),
      feedback: false,
      hasWarningsRemoved: floods._groups[3].name === 4 && floods._groups[3].count > 0,
      bingMaps: bingKeyMaps,
      outlookTimestamp: `${formatDate(outlook._timestampOutlook, 'h:mma')} on ${formatDate(outlook._timestampOutlook, 'D MMMM YYYY')}`,
      outlookUTC: moment(outlook._timestampOutlook).tz(tz).format(),
      dataError: outlook.dataError,
      isDummyData: floods.isDummyData,
      getWarnings: 'National:Related-content:Get-warnings',
      planAhead: 'National:Related-content:Plan-ahead-for-flooding',
      whatToDo: 'National:Related-content:What-to-do-in-a-flood',
      recoverAfter: 'National:Related-content:Recover-after-a-flood',
      longTerm: 'National:Related-content:Check-long-term-risk',
      reportFlood: 'National:Related-content:Report-a-flood'
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
        days: item.days
      }
    })[0]
  }
}

module.exports = ViewModel
