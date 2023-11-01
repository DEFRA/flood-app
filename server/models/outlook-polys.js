const turf = require('@turf/turf')

module.exports = class OutlookPolys {
  constructor (outlook, place) {
    this.polys = []
    const lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]

    const locationCoords = turf.polygon([[
      [place.bbox2k[0], place.bbox2k[1]],
      [place.bbox2k[0], place.bbox2k[3]],
      [place.bbox2k[2], place.bbox2k[3]],
      [place.bbox2k[2], place.bbox2k[1]],
      [place.bbox2k[0], place.bbox2k[1]]
    ]])

    for (const riskArea of outlook.risk_areas) {
      for (const riskAreaBlock of riskArea.risk_area_blocks) {
        for (const poly of riskAreaBlock.polys) {
          let polyCoords
          // if linestring ( i.e. coastal ) add buffer and change geometry for use with turf
          if (poly.poly_type === 'coastal') {
            polyCoords = turf.polygon(turf.buffer({
              type: 'Feature',
              properties: { polyType: 'coastal' },
              geometry: {
                type: 'LineString',
                coordinates: poly.coordinates
              }
            }, 1, { units: 'miles' }).geometry.coordinates)
          } else {
            polyCoords = turf.polygon(poly.coordinates)
          }

          // build array of polys that intersect
          if (turf.intersect(polyCoords, locationCoords)) {
            for (const day of riskAreaBlock.days) {
              for (const [key, [impact, likelihood]] of Object.entries(riskAreaBlock.risk_levels)) {
                const riskLevel = lookup[impact - 1][likelihood - 1]
                if (impact > 1 && !(impact === 2 && likelihood === 1)) {
                  this.polys.push({
                    riskLevel,
                    impact,
                    likelihood,
                    day,
                    polyId: poly.id,
                    source: key,
                    messageId: `${riskLevel}-i${impact}-l${likelihood}`
                  })
                }
              }
            }
          }
        }
      }
    }
    this.polys.sort(sortPolys)
  }
}

// Sort array of polygons that intersect with the location bounding box by:
// day if day is the same by messageId if messageId is the same by source
function sortPolys (a, b) {
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
  if (a.source > b.source) {
    return -1
  }
  return a.source < b.source
    ? 1
    : 0
}
