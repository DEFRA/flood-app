const turf = require('@turf/turf')
const { groupBy } = require('../util')
const outlookContent = require('./outlook-content.json')
const moment = require('moment-timezone')
const formatDate = require('../util').formatDate
const isEqual = require('lodash.isequal')
class OutlookTabs {
  constructor (outlook, place) {
    // this._outlook = outlook

    const polys = []
    const lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]
    const issueDate = (new Date(outlook.issued_at)).getTime()

    const formattedIssueDate = formatDate(outlook.issued_at, 'h:mma') + ' on ' + formatDate(outlook.issued_at, 'D MMMM YYYY')
    const issueUTC = moment(outlook.issued_at).tz('Europe/London').format()
    const yesterday = moment().subtract(1, 'days')

    this.issueDate = issueDate
    this.issueUTC = issueUTC
    this.formattedIssueDate = formattedIssueDate

    const locationCoords = turf.polygon([[
      [place.bbox2k[0], place.bbox2k[1]],
      [place.bbox2k[0], place.bbox2k[3]],
      [place.bbox2k[2], place.bbox2k[3]],
      [place.bbox2k[2], place.bbox2k[1]],
      [place.bbox2k[0], place.bbox2k[1]]
    ]])

    if (outlook.risk_areas) {
      outlook.risk_areas.forEach((riskArea) => {
        riskArea.risk_area_blocks.forEach(riskAreaBlock => {
          riskAreaBlock.polys.forEach(poly => {
            // if linestring ( i.e. coastal ) add buffer and change geometry

            if (poly.poly_type === 'coastal') {
              const feature = {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: poly.coordinates
                }
              }

              const buffer = turf.buffer(feature, 3, { units: 'miles' })

              const coordinates = buffer.geometry.coordinates
              feature.geometry.type = 'Polygon'
              feature.geometry.coordinates = coordinates
              poly.coordinates = coordinates
            }

            // test if poly intersects
            const polyCoords = turf.polygon(poly.coordinates)

            const intersection = turf.intersect(polyCoords, locationCoords)
            if (intersection) {
              const riskLevels = riskAreaBlock.risk_levels

              riskAreaBlock.days.forEach(day => {
                Object.keys(riskLevels).forEach(key => {
                  const impact = riskLevels[key][0]
                  const likelihood = riskLevels[key][1]
                  const riskLevel = lookup[impact - 1][likelihood - 1]
                  const polyId = poly.id

                  if (impact > 1 && !(impact === 2 && likelihood === 1)) {
                    polys.push({
                      riskLevel,
                      source: key,
                      impact,
                      likelihood,
                      day,
                      messageId: `${riskLevel}-i${impact}-l${likelihood}`,
                      polyId
                    })
                  }
                })
              })
            }
          })
        })
      })
    }

    // Sort array of polygons that intersect with the location bounding box by:
    //
    // day / messageId / source

    polys.sort((a, b) => {
      if (a.day === b.day) {
        if (a.messageId === b.messageId) {
          return (a.source > b.source) ? -1 : (a.source < b.source) ? 1 : 0
        } else {
          return (a.messageId > b.messageId) ? -1 : 1
        }
      } else {
        return (a.day < b.day) ? -1 : 1
      }
    })

    // Group by day

    this.groupByDay = groupBy(polys, 'day')

    this.groupByDayFull = groupBy(polys, 'day') // DEBUG PURPOSES ONY

    // Initalize groupByDayMessage 5 element array

    this.groupByDayMessage = [{}, {}, {}, {}, {}]

    const riskLevelText = {
      1: 'Very low',
      2: 'Low',
      3: 'Medium',
      4: 'High'
    }

    // Initialze daily risk level array to very low

    this.dailyRisk = [riskLevelText[1], riskLevelText[1], riskLevelText[1], riskLevelText[1], riskLevelText[1]]
    this.dailyRiskAsNum = [1, 1, 1, 1, 1]

    // Initialze array to identify risk level trend between days.

    this.trend = ['', 'remains at', 'remains at', 'remains at', 'remains at']

    // Find distinct messages for each source for each day
    for (const [day, messages] of Object.entries(this.groupByDay)) { // Outer loop messages
      const uniqueArray = []
      const mapMessages = new Map()

      for (const [index, item] of messages.entries()) { // Inner loop sources
        if (!mapMessages.has(item.source)) {
          if (index === 0) {
            this.dailyRisk[day - 1] = riskLevelText[item.riskLevel] // This equates to maximum risk level for the day
            this.dailyRiskAsNum[day - 1] = item.riskLevel
          }
          mapMessages.set(item.source, true) // set any value to Map
          uniqueArray.push({
            day: day,
            source: item.source,
            messageId: item.messageId,
            riskLevel: item.riskLevel
          })
        }
      }

      // Establish risk level trend for days 2, 3, 4 and 5
      for (let i = 1; i < 5; i++) {
        if (this.dailyRiskAsNum[i] > this.dailyRiskAsNum[i - 1]) {
          this.trend[i] = 'increases to'
        } else if (this.dailyRiskAsNum[i] < this.dailyRiskAsNum[i - 1]) {
          this.trend[i] = 'reduces to'
        } else {
          this.trend[i] = 'remains at'
        }
      }

      // Create object grouped by messageId
      const groupByUniqueArrayObj = groupBy(uniqueArray, 'messageId')

      // create array of sources for each messageId
      for (const [messageId, array] of Object.entries(groupByUniqueArrayObj)) {
        const sourcesArr = array.map(element => element.source)
        groupByUniqueArrayObj[messageId] = sourcesArr
      }

      // Add above for each day

      this.groupByDayMessage[day - 1] = groupByUniqueArrayObj
    }

    // Build content for each outlook tab. TODO: Refactor this.

    // Create highest daily risk for days in the Outlook tab

    const max = Math.max(...this.dailyRiskAsNum.slice(2))

    this.dailyRiskOutlookMax = riskLevelText[max]

    // if FGS is from yesterday push 1 in to tab1 instead of 0
    if (moment(issueDate).isSame(yesterday, 'day')) {
      this.tab1 = this.groupByDayMessage['1'] // Day 2
      this.tab2 = this.groupByDayMessage['2'] // Day 3
      this.tab3 = [this.groupByDayMessage['3'],
        this.groupByDayMessage['4']] // Day 4, 5

      this.tab2.day = moment(issueDate).add(1, 'days').format('dddd')
      this.tab3.days = [moment(issueDate).add(2, 'days').format('dddd'), moment(issueDate).add(3, 'days').format('dddd')]
    } else {
      this.tab1 = this.groupByDayMessage['0'] // Day 1

      this.tab2 = this.groupByDayMessage['1'] // Day 2

      // Create day name for days 2,3,4,5

      this.dayName = [
        moment(issueDate).format('dddd'), // Day 1
        moment(issueDate).add(1, 'days').format('dddd'), // Day 2
        moment(issueDate).add(2, 'days').format('dddd'), // Day 3
        moment(issueDate).add(3, 'days').format('dddd'), // Day 4
        moment(issueDate).add(4, 'days').format('dddd') // Day 5
      ]

      // Tab 3 day combinations.
      //
      // day 3, day 4, day 5 messageIds all different
      // day 3 and day 4 equal, day 5 different
      // day 4 and day 5 equal, day 3 different
      // day 3, day 4, day 5 all the same

      const day3 = this.groupByDayMessage['2']
      const day4 = this.groupByDayMessage['3']
      const day5 = this.groupByDayMessage['4']

      if (isEqual(day3, day4) && isEqual(day3, day5)) {
        this.tab3 = [day3]
        this.dayName[2] = `${this.dayName[2]}, ${this.dayName[3]} and ${this.dayName[4]}`
      } else if (isEqual(day3, day4)) {
        this.tab3 = [day3, day5]
        this.dayName[2] = `${this.dayName[2]} and ${this.dayName[3]}`
      } else if (isEqual(day4, day5)) {
        this.tab3 = [day3, day4]
        this.dayName[3] = `${this.dayName[3]} and ${this.dayName[4]}`
      } else {
        this.tab3 = [day3, day4, day5]
      }
    }

    // Create days array for use with map
    const days = [0, 1, 2, 3, 4].map(i => {
      const date = new Date(issueDate)
      return {
        idx: i + 1,
        level: 1,
        date: new Date(date.setDate(date.getDate() + i))
      }
    })

    this.days = days

    // debug stuff, remove when done

    this.messages1 = []
    this.messages2 = []
    this.messages3 = []

    Object.entries(this.groupByDayMessage['0']).forEach(([key, value]) => {
      this.messages1.push(`${key}: ${value}: ${outlookContent[key]}`)
    })
    Object.entries(this.groupByDayMessage['1']).forEach(([key, value]) => {
      this.messages2.push(`${key}: ${value}: ${outlookContent[key]}`)
    })
    Object.entries(this.groupByDayMessage['2']).forEach(([key, value]) => {
      this.messages3.push(`${key}: ${value}: ${outlookContent[key]}`)
    })
  }
}

module.exports = OutlookTabs
