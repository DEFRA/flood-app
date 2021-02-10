const turf = require('@turf/turf')

class OutlookTabs {
  constructor (outlook, place) {
    // this._outlook = outlook

    const polys = []
    const lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]
    const issueDate = (new Date(outlook.issued_at)).getTime()

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
            // test if poly intersects
            const polyCoords = turf.polygon(poly.coordinates)
            const intersection = turf.intersect(polyCoords, locationCoords)
            if (intersection) {
              const riskLevels = riskAreaBlock.risk_levels

              riskAreaBlock.days.forEach(day => {
                let tab
                switch (day) {
                  case 1:
                    tab = 'today'
                    break
                  case 2:
                    tab = 'tomorrow'
                    break
                  default: tab = 'outlook'
                }
                Object.keys(riskLevels).forEach(key => {
                  const impact = riskLevels[key][0]
                  const likelihood = riskLevels[key][1]
                  const riskLevel = lookup[impact - 1][likelihood - 1]
                  const polyId = poly.id

                  if (impact > 1 && !(impact === 2 && likelihood === 1)) {
                    polys.push({
                      tab: tab,
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

    // Create days array for use with map
    const days = [0, 1, 2, 3, 4].map(i => {
      const date = new Date(issueDate)
      return {
        idx: i + 1,
        level: 1,
        date: new Date(date.setDate(date.getDate() + i))
      }
    })

    this.polys = polys
    this.days = days

    // Where source and the day are the same, remove items with lowest risk-level if risk-level
    // is the same then lowest impact if impact is the same then lowest likelihood. We should now
    // have unique sources for each day.
  }
}

module.exports = OutlookTabs
