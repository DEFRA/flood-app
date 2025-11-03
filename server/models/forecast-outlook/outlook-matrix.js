const MATRIX_DAYS = 5
const turf = require('@turf/turf')

module.exports = class OutlookMatrix {
  constructor (outlook, location = null) {
    this.outlook = outlook
    this.location = location
  }

  get matrixData () {
    const matrix = Array(MATRIX_DAYS).fill().map(() =>
      Array(4).fill().map(() => [0, 0])
    )

    const sourceMap = {
      river: 0,
      coastal: 1,
      surface: 2,
      ground: 3
    }

    if (this.location?.bbox2k && this.outlook?.risk_areas) {
      this.outlook.risk_areas.forEach(riskArea => {
        riskArea.risk_area_blocks.forEach(riskAreaBlock => {
          if (this.riskAreaIntersectsLocation(riskAreaBlock)) {
            this.processRiskAreaBlock(riskAreaBlock, matrix, sourceMap)
          }
        })
      })
    }

    return matrix
  }

  // Priority ranking logic
  getPriorityRank ([impact, likelihood]) {
    const priorityOrder = [
      [4, 4], // Red
      [4, 3], [3, 4], [3, 3], [4, 2], // Orange
      [2, 4], [3, 2], [2, 3], // Yellow
      [2, 2] // Green
    ]
    return priorityOrder.findIndex(([i, l]) => i === impact && l === likelihood)
  }

  processRiskAreaBlock (riskAreaBlock, matrix, sourceMap) {
    for (const [sourceKey, [impact, likelihood]] of Object.entries(riskAreaBlock.risk_levels)) {
      const sourceIndex = sourceMap[sourceKey]
      if (sourceIndex === undefined) {
        continue
      }

      riskAreaBlock.days.forEach(day => {
        const dayIndex = day - 1
        if (dayIndex >= 0 && dayIndex < MATRIX_DAYS) {
          const current = matrix[dayIndex][sourceIndex]
          const currentRank = this.getPriorityRank(current)
          const newRank = this.getPriorityRank([impact, likelihood])

          if (newRank !== -1 && (currentRank === -1 || newRank < currentRank)) {
            matrix[dayIndex][sourceIndex] = [impact, likelihood]
          }
        }
      })
    }
  }

  riskAreaIntersectsLocation (riskAreaBlock) {
    if (!this.location?.bbox2k) {
      return false
    }

    const locationPolygon = turf.bboxPolygon(this.location.bbox2k)

    for (const poly of riskAreaBlock.polys) {
      let riskAreaPolygon = null

      switch (poly.poly_type) {
        case 'inland': {
          const coords = Array.isArray(poly.coordinates?.[0]?.[0])
            ? poly.coordinates
            : [poly.coordinates]

          if (this.isValidPolygonCoordinates(coords)) {
            riskAreaPolygon = turf.polygon(coords)
          }
          break
        }
        case 'coastal': {
          const lineCoords = Array.isArray(poly.coordinates?.[0])
            ? poly.coordinates
            : [poly.coordinates]

          if (this.isValidLineStringCoordinates(lineCoords)) {
            const lineString = turf.lineString(lineCoords)
            // ✅ Apply buffer for coastal lines (1 mile)
            riskAreaPolygon = turf.buffer(lineString, 1, { units: 'miles' })
          }
          break
        }
        default:
          // Do nothing
      }

      if (riskAreaPolygon && turf.booleanIntersects(locationPolygon, riskAreaPolygon)) {
        return true
      }
    }

    return false
  }

  isValidPolygonCoordinates (coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return false
    } else {
      const rings = Array.isArray(coordinates[0][0]) ? coordinates : [coordinates]
      return rings.every(ring =>
        Array.isArray(ring) && ring.length > 0 &&
        ring.every(coord =>
          Array.isArray(coord) && coord.length >= 2 &&
          typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
          !isNaN(coord[0]) && !isNaN(coord[1])
        )
      )
    }
  }

  isValidLineStringCoordinates (coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return false
    } else {
      return coordinates.every(coord =>
        Array.isArray(coord) && coord.length >= 2 &&
        typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
        !isNaN(coord[0]) && !isNaN(coord[1])
      )
    }
  }
}
