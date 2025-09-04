const turf = require('@turf/turf')

const alert = 1
const warning = 2
const severe = 3
const nlif = 4

const RISK_LEVELS = new Map([
  [alert, new Map([[alert, alert], [warning, alert], [severe, alert], [nlif, alert]])],
  [warning, new Map([[alert, alert], [warning, alert], [severe, warning], [nlif, warning]])],
  [severe, new Map([[alert, warning], [warning, warning], [severe, severe], [nlif, severe]])],
  [nlif, new Map([[alert, warning], [warning, severe], [severe, severe], [nlif, nlif]])]
])

module.exports = class OutlookPolys {
  constructor (outlook, place) {
    this.polys = []
    this.messageIds = []

    const locationCoords = turf.polygon([
      [
        [place.bbox2k[0], place.bbox2k[1]],
        [place.bbox2k[0], place.bbox2k[3]],
        [place.bbox2k[2], place.bbox2k[3]],
        [place.bbox2k[2], place.bbox2k[1]],
        [place.bbox2k[0], place.bbox2k[1]]
      ]
    ])

    outlook.risk_areas.forEach(riskArea => {
      riskArea.risk_area_blocks.forEach(riskAreaBlock => {
        this.polyIntersectCheck(riskAreaBlock, locationCoords)
      })
    })

    this.polys.sort(sortPolys)
  }

  polyIntersectCheck (riskAreaBlock, locationCoords) {
    riskAreaBlock.polys.forEach(poly => {
      // build array of polys that intersect
      if (!turf.intersect(getPolyCoords(poly), locationCoords)) {
        return
      }
      riskAreaBlock.days.forEach(day => {
        this.buildRiskAreaArray(riskAreaBlock, day, poly)
      })
    })
  }

  buildRiskAreaArray (riskAreaBlock, day, poly) {
    for (const [key, [impact, likelihood]] of Object.entries(riskAreaBlock.risk_levels)) {
      if (impact > 1 && !(impact === 2 && likelihood === 1)) {
        const riskLevel = RISK_LEVELS.get(impact).get(likelihood)
        const messageId = `${riskLevel}-i${impact}-l${likelihood}`
        this.messageIds.push({
          messageId,
          day,
          source: key,
          polyId: poly.id
        })

        this.polys.push({
          riskLevel,
          impact,
          likelihood,
          day,
          polyId: poly.id,
          source: key,
          messageId
        })
      }
    }
  }
}

function getPolyCoords (poly) {
  // if linestring ( i.e. coastal ) add buffer and change geometry for use with turf
  if (poly.poly_type === 'coastal') {
    return turf.polygon(turf.buffer({
      type: 'Feature',
      properties: { polyType: 'coastal' },
      geometry: {
        type: 'LineString',
        coordinates: poly.coordinates
      }
    }, 1, { units: 'miles' }).geometry.coordinates)
  }
  return turf.polygon(poly.coordinates)
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
