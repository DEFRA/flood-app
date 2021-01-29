class OutlookTabs {
  constructor (outlook) {
    this._outlook = outlook

    const polys = []
    const lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]

    outlook.risk_areas.forEach((riskArea) => {
      riskArea.risk_area_blocks.forEach(riskAreaBlock => {
        riskAreaBlock.polys.forEach(poly => {
        // test if poly intersects
        //    const poly = {}
          const riskLevels = riskAreaBlock.risk_levels

          riskAreaBlock.days.forEach(day => {
            Object.keys(riskLevels).forEach(key => {
              const impact = riskLevels[key][0]
              const likelyhood = riskLevels[key][1]
              const riskLevel = lookup[impact - 1][likelyhood - 1]

              // exclude 2,2 or less

              if (impact > 1 && !(impact === 2 && likelyhood === 1)) {
                polys.push({
                  riskLevel,
                  source: key,
                  impact,
                  likelyhood,
                  day,
                  messageId: `${riskLevel}-i${impact}-l${likelyhood}`
                })
              }
            })
          })
        })
      })
    })

    // Where source and the day are the same, remove items with lowest risk-level if risk-level
    // is the same then lowest impact if impact is the same then lowest likelihood. We should now
    // have unique sources for each day.
  }
}

module.exports = OutlookTabs
