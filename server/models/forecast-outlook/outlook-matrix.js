const MATRIX_DAYS = 5
const turf = require('@turf/turf')
const { LIKELIHOOD, IMPACT } = require('./outlook-constants')

module.exports = class OutlookMatrix {
  constructor (outlook, location = null) {
    this.outlook = outlook
    this.location = location
  }

  get matrixData () {
    const matrix = Array.from({ length: MATRIX_DAYS }).fill().map(() =>
      Array.from({ length: 4 }).fill().map(() => [0, 0])
    )

    const sourceMap = {
      river: 0,
      coastal: 1,
      surface: 2,
      ground: 3
    }

    if (this.location?.bbox2k && this.outlook?.risk_areas) {
      this.processRiskAreas(this.outlook.risk_areas, matrix, sourceMap)
    }

    return matrix
  }

  // Priority ranking logic
  getPriorityRank ([impact, likelihood]) {
    const priorityOrder = [
      [IMPACT.Severe, LIKELIHOOD.High], // Red
      [IMPACT.Severe, LIKELIHOOD.Medium], [IMPACT.Significant, LIKELIHOOD.High], [IMPACT.Significant, LIKELIHOOD.Medium], [IMPACT.Severe, LIKELIHOOD.Low], // Orange
      [IMPACT.Minor, LIKELIHOOD.High], [IMPACT.Significant, LIKELIHOOD.Low], [IMPACT.Minor, LIKELIHOOD.Medium], // Yellow
      [IMPACT.Minor, LIKELIHOOD.Low] // Green
    ]
    return priorityOrder.findIndex(([i, l]) => i === impact && l === likelihood)
  }

  processRiskAreas (riskAreas, matrix, sourceMap) {
    for (const riskArea of riskAreas) {
      for (const riskAreaBlock of riskArea.risk_area_blocks) {
        if (this.riskAreaIntersectsLocation(riskAreaBlock)) {
          this.processRiskAreaBlock(riskAreaBlock, matrix, sourceMap)
        }
      }
    }
  }

  processRiskAreaBlock (riskAreaBlock, matrix, sourceMap) {
    for (const [sourceKey, [impact, likelihood]] of Object.entries(riskAreaBlock.risk_levels)) {
      const sourceIndex = sourceMap[sourceKey]
      if (sourceIndex === undefined) {
        continue
      }
      const riskAreaBlockDaysConfig = { riskAreaBlock, matrix, impact, likelihood, sourceIndex }
      this.processRiskAreaBlockDays(riskAreaBlockDaysConfig)
    }
  }

  processRiskAreaBlockDays (config) {
    for (const day of config.riskAreaBlock.days) {
      const dayIndex = day - 1
      if (dayIndex >= 0 && dayIndex < MATRIX_DAYS) {
        const current = config.matrix[dayIndex][config.sourceIndex]
        const currentRank = this.getPriorityRank(current)
        const newRank = this.getPriorityRank([config.impact, config.likelihood])

        if (newRank !== -1 && (currentRank === -1 || newRank < currentRank)) {
          config.matrix[dayIndex][config.sourceIndex] = [config.impact, config.likelihood]
        }
      }
    }
  }

  riskAreaIntersectsLocation (riskAreaBlock) {
    if (!this.location?.bbox2k) {
      return false
    }

    const locationPolygon = turf.bboxPolygon(this.location.bbox2k)

    for (const poly of riskAreaBlock.polys) {
      const riskAreaPolygon = this.getRiskAreaPolygon(poly)
      if (riskAreaPolygon && turf.booleanIntersects(locationPolygon, riskAreaPolygon)) {
        return true
      }
    }

    return false
  }

  getRiskAreaPolygon (poly) {
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
    return riskAreaPolygon
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
          !Number.isNaN(coord[0]) && !Number.isNaN(coord[1])
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
        !Number.isNaN(coord[0]) && !Number.isNaN(coord[1])
      )
    }
  }
}
