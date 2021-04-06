const turf = require('@turf/turf')

class OutlookPolys {
  constructor (outlook, place) {
    const polys = []
    const lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]

    const locationCoords = turf.polygon([[
      [place.bbox2k[0], place.bbox2k[1]],
      [place.bbox2k[0], place.bbox2k[3]],
      [place.bbox2k[2], place.bbox2k[3]],
      [place.bbox2k[2], place.bbox2k[1]],
      [place.bbox2k[0], place.bbox2k[1]]
    ]])

    outlook.risk_areas.forEach(riskArea => {
      riskArea.risk_area_blocks.forEach(riskAreaBlock => {
        riskAreaBlock.polys.forEach(poly => {
          // if linestring ( i.e. coastal ) add buffer and change geometry for use with turf
          if (poly.poly_type === 'coastal') {
            const feature = {
              type: 'Feature',
              properties: { polyType: 'coastal' },
              geometry: {
                type: 'LineString',
                coordinates: poly.coordinates
              }
            }

            const buffer = turf.buffer(feature, 1, { units: 'miles' })
            const coordinates = buffer.geometry.coordinates
            feature.geometry.type = 'Polygon'
            feature.geometry.coordinates = coordinates
            poly.coordinates = coordinates
          }

          // test if poly intersects
          const polyCoords = turf.polygon(poly.coordinates)

          const intersection = turf.intersect(polyCoords, locationCoords)

          // build array of polys that intersect
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
                    impact,
                    likelihood,
                    day,
                    polyId,
                    source: key,
                    messageId: `${riskLevel}-i${impact}-l${likelihood}`
                  })
                }
              })
            })
          }
        })
      })
    })

    // Sort array of polygons that intersect with the location bounding box by:
    // day if day is the same by messageId if messageId is the same by source

    polys.sort((a, b) => {
      if (a.day !== b.day) {
        return a.day < b.day
          ? -1
          : 1
      }
      if (a.messageId !== b.messageId) {
        return a.messageId > b.messageId
          ? -1
          : 1
      }
      const r = a.source < b.source
        ? 1
        : 0
      return a.source > b.source
        ? -1
        : r
    })

    this.polys = polys
  }
}

module.exports = OutlookPolys
