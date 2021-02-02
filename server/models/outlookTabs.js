const turf = require('@turf/turf')

class OutlookTabs {
  constructor (outlook, place) {
    // this._outlook = outlook

    const polys = []
    const lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]

    outlook.risk_areas.forEach((riskArea) => {
      riskArea.risk_area_blocks.forEach(riskAreaBlock => {
        riskAreaBlock.polys.forEach(poly => {
        // test if poly intersects
        //    const poly = {}
          const polyCoords = turf.polygon(poly.coordinates)
          const locationCoords = turf.polygon([[
            [place.bbox2k[0], place.bbox2k[1]],
            [place.bbox2k[0], place.bbox2k[3]],
            [place.bbox2k[2], place.bbox2k[3]],
            [place.bbox2k[2], place.bbox2k[1]],
            [place.bbox2k[0], place.bbox2k[1]]
          ]])
          const intersection = turf.intersect(polyCoords, locationCoords)
          if (intersection) {
            const riskLevels = riskAreaBlock.risk_levels

            riskAreaBlock.days.forEach(day => {
              Object.keys(riskLevels).forEach(key => {
                const impact = riskLevels[key][0]
                const likelyhood = riskLevels[key][1]
                const riskLevel = lookup[impact - 1][likelyhood - 1]
                const polyId = poly.id

                if (impact > 1 && !(impact === 2 && likelyhood === 1)) {
                  polys.push({
                    riskLevel,
                    source: key,
                    impact,
                    likelyhood,
                    day,
                    messageId: `${riskLevel}-i${impact}-l${likelyhood}`,
                    polyId
                  })
                }
              })
            })
          }
        })
      })
    })

    this.polys = polys

    // Where source and the day are the same, remove items with lowest risk-level if risk-level
    // is the same then lowest impact if impact is the same then lowest likelihood. We should now
    // have unique sources for each day.
  }
}

module.exports = OutlookTabs
