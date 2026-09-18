const { groupBy } = require('../util')
const moment = require('moment-timezone')
const formatDate = require('../util').formatDate
const isEqual = require('lodash.isequal')
const OutlookPolys = require('./outlook-polys')
const OutLookTabGroupMessages = require('./outlook-tabs-group-messages')

const FORECAST_DAYS = 5

class OutlookTabs {
  constructor (outlook, place) {
    const issueDate = moment(outlook.issued_at)
    const yesterday = moment().subtract(1, 'days')
    const dayMinus2 = moment().subtract(2, 'days')

    const polys = new OutlookPolys(outlook, place)
    const groupByDay = groupBy(polys.polys, 'day')

    const { riskLevelText, dailyRisk, dailyRiskAsNum, trend } = this.initializeRiskData()
    const groupByDayMessage = this.processMessages(groupByDay, dailyRisk, riskLevelText, dailyRiskAsNum, trend)

    this.dayName = this.initializeDayNames(issueDate)
    const offset = this.calculateOffset(issueDate, yesterday, dayMinus2)

    const { activeMessages, labels, activeDailyRiskAsNum, activeTrend } = this.prepareActiveData(groupByDayMessage, offset, dailyRiskAsNum, trend)

    // Trim all daily risk arrays to match active days (stale FGS offset)
    const activeDailyRisk = Array.from({ length: activeDailyRiskAsNum.length }, (_, i) => riskLevelText[activeDailyRiskAsNum[i]])
    const activeTrendArray = activeTrend

    this.groups = this.groupAdjacentDays(activeMessages, labels, activeDailyRiskAsNum, activeTrend, riskLevelText)
    this.assignSpecialCases()

    const days = this.createDaysArray(issueDate)
    const dailyRiskOutlookMax = Math.max(...dailyRiskAsNum.slice(2))

    const propertiesData = {
      days,
      issueDate,
      outlook,
      dailyRisk: activeDailyRisk,
      dailyRiskAsNum: activeDailyRiskAsNum,
      dailyRiskOutlookMax,
      riskLevelText,
      trend: activeTrendArray
    }
    this.assignProperties(propertiesData)
  }

  initializeRiskData () {
    const riskLevelText = {
      1: 'Very low',
      2: 'Low',
      3: 'Medium',
      4: 'High'
    }

    const dailyRisk = Array.from({ length: FORECAST_DAYS }, () => riskLevelText[1])
    const dailyRiskAsNum = Array.from({ length: FORECAST_DAYS }, () => 1)
    const trend = Array.from({ length: FORECAST_DAYS }, (_, i) => i === 0 ? '' : 'remains')

    return { riskLevelText, dailyRisk, dailyRiskAsNum, trend }
  }

  processMessages (groupByDay, dailyRisk, riskLevelText, dailyRiskAsNum, trend) {
    let groupByDayMessage = Array.from({ length: FORECAST_DAYS }, () => ({}))
    for (const [day, messages] of Object.entries(groupByDay)) {
      const outLookTabGroupMessages = new OutLookTabGroupMessages(groupByDayMessage, messages, dailyRisk, riskLevelText, dailyRiskAsNum, day, trend)
      groupByDayMessage = outLookTabGroupMessages.groupByDayMessage
    }
    return groupByDayMessage
  }

  initializeDayNames (issueDate) {
    return Array.from({ length: FORECAST_DAYS }, (_, i) => {
      return moment(issueDate).add(i, 'days').format('dddd')
    })
  }

  calculateOffset (issueDate, yesterday, dayMinus2) {
    const issueDateMinus1 = moment(issueDate).isSame(yesterday, 'day')
    const issueDateMinus2 = moment(issueDate).isSame(dayMinus2, 'day')

    let offset
    if (issueDateMinus1) {
      offset = 1
    } else if (issueDateMinus2) {
      offset = 2
    } else {
      offset = 0
    }
    return offset
  }

  prepareActiveData (groupByDayMessage, offset, dailyRiskAsNum, trend) {
    const activeMessages = groupByDayMessage.slice(offset)
    const activeDayName = this.dayName.slice(offset)
    const activeDailyRiskAsNum = dailyRiskAsNum.slice(offset)
    const activeTrend = trend.slice(offset)

    const labels = activeDayName.map((name, index) => {
      if (index === 0) { return 'Today' }
      if (index === 1) { return 'Tomorrow' }
      return name
    })

    return { activeMessages, labels, activeDailyRiskAsNum, activeTrend }
  }

  assignSpecialCases () {
    const isSingleGroup = this.groups.length === 1
    const isSingleGroupEmpty = isSingleGroup && Object.keys(this.groups[0].message).length === 0

    if (isSingleGroupEmpty) {
      this.lowForFive = true
    } else if (isSingleGroup) {
      this.allDaysSame = true
      this.day5Name = this.dayName.at(-1)
    } else {
      // Neither condition met - no action required
    }
  }

  createDaysArray (issueDate) {
    return Array.from({ length: FORECAST_DAYS }, (_, i) => {
      const date = new Date(issueDate)
      return {
        idx: i + 1,
        level: 1,
        date: new Date(date.setDate(date.getDate() + i))
      }
    })
  }

  assignProperties (data) {
    const { days, issueDate, outlook, dailyRisk, dailyRiskAsNum, dailyRiskOutlookMax, riskLevelText, trend } = data
    const formattedIssueDate = `${formatDate(outlook.issued_at, 'h:mma')} on ${formatDate(outlook.issued_at, 'D MMMM YYYY')}`
    const issueUTC = moment(outlook.issued_at).tz('Europe/London').format()
    const dailyRiskOutlookMaxText = riskLevelText[dailyRiskOutlookMax]

    this.days = days
    this.issueDate = issueDate
    this.issueUTC = issueUTC
    this.formattedIssueDate = formattedIssueDate
    this.dailyRisk = dailyRisk
    this.dailyRiskAsNum = dailyRiskAsNum
    this.dailyRiskOutlookMax = dailyRiskOutlookMax
    this.dailyRiskOutlookMaxText = dailyRiskOutlookMaxText
    this.trend = trend
  }

  // Groups adjacent days that share identical impact, likelihood and source content.
  groupAdjacentDays (messages, labels, dailyRiskAsNum, trend, riskLevelText) {
    const groups = []
    let start = 0

    while (start < messages.length) {
      let end = start
      while (end + 1 < messages.length && isEqual(messages[end + 1], messages[start])) {
        end++
      }

      groups.push({
        heading: this.buildGroupHeading(labels, start, end),
        message: messages[start],
        isEmpty: Object.keys(messages[start]).length === 0,
        dailyRisk: riskLevelText[dailyRiskAsNum[start]],
        trend: trend[start],
        isFirst: start === 0
      })

      start = end + 1
    }

    return groups
  }

  // D25: two adjacent days are joined with "and". D26: three or more adjacent
  // days show only the first and last day name, joined with "through to".
  buildGroupHeading (labels, start, end) {
    if (start === end) {
      return labels[start]
    }
    if (end - start === 1) {
      return `${labels[start]} and ${labels[end]}`
    }
    return `${labels[start]} through to ${labels[end]}`
  }
}

module.exports = OutlookTabs
