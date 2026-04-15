const { groupBy } = require('../util')
const moment = require('moment-timezone')
const formatDate = require('../util').formatDate
const isEqual = require('lodash.isequal')
const OutlookPolys = require('./outlook-polys')
const OutLookTabGroupMessages = require('./outlook-tabs-group-messages')

class OutlookForecast {
  constructor (outlook, place) {
    const issueDate = moment(outlook.issued_at)

    const formattedIssueDate = `${formatDate(outlook.issued_at, 'h:mma')} on ${formatDate(outlook.issued_at, 'D MMMM YYYY')}`
    const issueUTC = moment(outlook.issued_at).tz('Europe/London').format()
    const yesterday = moment().subtract(1, 'days')
    const dayMinus2 = moment().subtract(2, 'days')

    const polys = new OutlookPolys(outlook, place)
    // Group by day

    const groupByDay = groupBy(polys.polys, 'day')

    // Initalize groupByDayMessage 5 element array

    let groupByDayMessage = [{}, {}, {}, {}, {}]

    const riskLevelText = {
      1: 'Very low',
      2: 'Low',
      3: 'Medium',
      4: 'High'
    }

    // Initialze daily risk level array to very low

    const dailyRisk = [riskLevelText[1], riskLevelText[1], riskLevelText[1], riskLevelText[1], riskLevelText[1]]
    const dailyRiskAsNum = [1, 1, 1, 1, 1]

    // Initialze array to identify risk level trend between days.

    const trend = ['', 'remains', 'remains', 'remains', 'remains']

    // Find distinct messages for each source for each day
    for (const [day, messages] of Object.entries(groupByDay)) { // Outer loop messages
      const outLookTabGroupMessages = new OutLookTabGroupMessages(groupByDayMessage, messages, dailyRisk, riskLevelText, dailyRiskAsNum, day, trend)
      groupByDayMessage = outLookTabGroupMessages.groupByDayMessage
    }

    // Build content for each outlook section.

    // Create highest daily risk for days in the outlook section

    const dailyRiskOutlookMax = Math.max(...dailyRiskAsNum.slice(2))

    const dailyRiskOutlookMaxText = riskLevelText[dailyRiskOutlookMax]

    // Create days array for use with map
    const days = [0, 1, 2, 3, 4].map(i => {
      const date = new Date(issueDate)
      return {
        idx: i + 1,
        level: 1,
        date: new Date(date.setDate(date.getDate() + i))
      }
    })

    // Create day name for days 2,3,4,5
    this.dayName = [
      moment(issueDate).format('dddd'), // Day 1
      moment(issueDate).add(1, 'days').format('dddd'), // Day 2
      moment(issueDate).add(2, 'days').format('dddd'), // Day 3
      moment(issueDate).add(3, 'days').format('dddd'), // Day 4
      moment(issueDate).add(4, 'days').format('dddd') // Day 5
    ]

    // if FGS is from yesterday push 1 in to today instead of 0

    const issueDateMinus1 = moment(issueDate).isSame(yesterday, 'day')
    const issueDateMinus2 = (moment(issueDate).isSame(dayMinus2, 'day'))

    this.createOutlookSections(issueDateMinus1, groupByDayMessage, dailyRisk, dailyRiskAsNum, trend, issueDateMinus2)

    // Check if all outlook sections have no data

    // Outlook days may have up to 3 days content
    let outlookDaysEmpty = true
    this.outlookDays.forEach(item => {
      if (Object.keys(item).length !== 0) {
        outlookDaysEmpty = false
      }
    })

    this.isOutlookLow(outlookDaysEmpty)

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

  createOutlookSections (issueDateMinus1, groupByDayMessage, dailyRisk, dailyRiskAsNum, trend, issueDateMinus2) {
    if (issueDateMinus1) {
      this.today = groupByDayMessage['1'] // Day 2
      this.tomorrow = groupByDayMessage['2'] // Day 3
      this.outlookDays = [groupByDayMessage['3'],
        groupByDayMessage['4']] // Day 4, 5

      // dayName and daily risk arrays need to tie in with the above
      this.dayName.shift()
      dailyRisk.shift()
      dailyRiskAsNum.shift()
      trend.shift()

      // if FGS is day before yesterday push 2 in to today instead of 0
    } else if (issueDateMinus2) {
      this.today = groupByDayMessage['2'] // Day 3
      this.tomorrow = groupByDayMessage['3'] // Day 4
      this.outlookDays = [groupByDayMessage['4']] // Day 5

      // dayName and daily risk arrays need to tie in with the above
      this.dayName.splice(0, 2)
      dailyRisk.splice(0, 2)
      dailyRiskAsNum.splice(0, 2)
      trend.splice(0, 2)
    } else {
      this.today = groupByDayMessage['0'] // Day 1

      this.tomorrow = groupByDayMessage['1'] // Day 2

      // Outlook days combinations.
      //
      // day 3, day 4, day 5 messageIds all different
      // day 3 and day 4 equal, day 5 different
      // day 4 and day 5 equal, day 3 different
      // day 3, day 4, day 5 all the same
      const day3 = groupByDayMessage['2']
      const day4 = groupByDayMessage['3']
      const day5 = groupByDayMessage['4']

      if (isEqual(day3, day4) && isEqual(day3, day5)) {
        this.outlookDays = [day3]
        this.dayName[2] = `${this.dayName[2]}, ${this.dayName[3]} and ${this.dayName[4]}`
      } else if (isEqual(day3, day4)) {
        this.outlookDays = [day3, day5]
        this.dayName[2] = `${this.dayName[2]} and ${this.dayName[3]}`

        // Shuffle down fifth day into fourth day slot as days 3 & 4 have been merged into day 3.
        // Move associated risk values and trend descriptions as well.
        this.dayName[3] = this.dayName[4]
        dailyRiskAsNum[3] = dailyRiskAsNum[4]
        trend[3] = trend[4]
        dailyRisk[3] = dailyRisk[4]
      } else if (isEqual(day4, day5)) {
        this.outlookDays = [day3, day4]
        this.dayName[3] = `${this.dayName[3]} and ${this.dayName[4]}`
      } else {
        this.outlookDays = [day3, day4, day5]
      }
    }

    // Backward-compatible aliases for callers not yet migrated.
    this.tab1 = this.today
    this.tab2 = this.tomorrow
    this.tab3 = this.outlookDays
  }

  isOutlookLow (outlookDaysEmpty) {
    if (Object.keys(this.today).length === 0 &&
      Object.keys(this.tomorrow).length === 0 &&
      outlookDaysEmpty) {
      this.lowForFive = true
    }
  }
}

module.exports = OutlookForecast
