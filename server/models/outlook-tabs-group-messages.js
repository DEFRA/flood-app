const { groupBy } = require('../util')

class OutlookTabsGroupMessages {
  constructor (groupByDayMessage, messages, dailyRisk, riskLevelText, dailyRiskAsNum, day, trend) {
    const intDay = parseInt(day)
    const uniqueArray = []
    const mapMessages = new Map()

    for (const [index, item] of messages.entries()) { // Inner loop sources
      if (!mapMessages.has(item.source)) {
        if (index === 0) {
          dailyRisk[intDay - 1] = riskLevelText[item.riskLevel] // This equates to maximum risk level for the day
          dailyRiskAsNum[intDay - 1] = item.riskLevel
        }
        mapMessages.set(item.source, true) // set any value to Map
        uniqueArray.push({
          day,
          source: item.source,
          messageId: item.messageId,
          riskLevel: item.riskLevel
        })
      }
    }

    // Establish risk level trend for days 2, 3, 4 and 5
    for (let i = 1; i < 5; i++) {
      const fallsRemains = dailyRiskAsNum[i] < dailyRiskAsNum[i - 1]
        ? 'falls to'
        : 'remains'
      trend[i] = dailyRiskAsNum[i] > dailyRiskAsNum[i - 1]
        ? 'rises to'
        : fallsRemains
    }

    // Create object grouped by messageId
    const groupByUniqueArrayObj = groupBy(uniqueArray, 'messageId')

    // create array of sources for each messageId

    const expandedSource = {
      river: 'overflowing rivers',
      surface: 'runoff from rainfall or blocked drains',
      ground: 'a high water table',
      coastal: 'high tides or large waves'
    }

    for (const [messageId, array] of Object.entries(groupByUniqueArrayObj)) {
      let sourcesArr = array.map(element => expandedSource[element.source] || element.source)

      capitaliseString(messageId, sourcesArr)

      if (sourcesArr.length > 1) {
        const lastSource = sourcesArr.pop()
        sourcesArr = `${sourcesArr.slice(0).join(', ')} and ${lastSource}`
      }
      groupByUniqueArrayObj[messageId] = sourcesArr
    }

    // Add above for each day
    groupByDayMessage[intDay - 1] = groupByUniqueArrayObj

    this.groupByDayMessage = groupByDayMessage
  }
}

function capitaliseString (messageId, sourcesArr) {
  if (messageId === '3-i4-l2') {
    sourcesArr[0] = sourcesArr[0].charAt(0).toUpperCase() + sourcesArr[0].slice(1)
  }
  return sourcesArr
}

module.exports = OutlookTabsGroupMessages
