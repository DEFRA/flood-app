// Development override for matrix data - set to true to use override, false to use original outlook data
const USE_DEV_MATRIX_OVERRIDE = false

const DEV_MATRIX_OVERRIDE = [
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 1 - All zeros to test "very low" message
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 2
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 3
  [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 4
  [[0, 0], [0, 0], [0, 0], [0, 0]] // Day 5
]

const turf = require('@turf/turf')

module.exports = class OutlookMatrix {
  constructor (outlook, location = null) {
    this.outlook = outlook
    this.location = location
  }

  get matrixData () {
    // Return override matrix if enabled (for development/testing)
    if (USE_DEV_MATRIX_OVERRIDE) {
      return DEV_MATRIX_OVERRIDE
    }

    // If no location is provided, return empty matrix (no national fallback)
    if (!this.location || !this.location.bbox2k) {
      return Array(5).fill().map(() => Array(4).fill().map(() => [0, 0]))
    }

    // Create 5x4 matrix: [day][source][impact, likelihood]
    // Sources: [river, coastal, surface, ground]
    const matrix = Array(5).fill().map(() =>
      Array(4).fill().map(() => [0, 0])
    )

    // Source mapping to array index
    const sourceMap = {
      river: 0,
      coastal: 1,
      surface: 2,
      ground: 3
    }

    // Process risk areas that intersect with the location
    if (this.outlook && this.outlook.risk_areas) {
      this.outlook.risk_areas.forEach(riskArea => {
        riskArea.risk_area_blocks.forEach(riskAreaBlock => {
          // Only include risk areas that intersect with location bbox
          if (this.riskAreaIntersectsLocation(riskAreaBlock)) {
            this.processRiskAreaBlock(riskAreaBlock, matrix, sourceMap)
          }
        })
      })
    }

    return matrix
  }

  processRiskAreaBlock (riskAreaBlock, matrix, sourceMap) {
    // Process each source type in the risk levels
    for (const [sourceKey, [impact, likelihood]] of Object.entries(riskAreaBlock.risk_levels)) {
      const sourceIndex = sourceMap[sourceKey]

      if (sourceIndex !== undefined) {
        // Apply to each day this risk area block covers
        riskAreaBlock.days.forEach(day => {
          const dayIndex = day - 1 // Convert 1-based day to 0-based index

          if (dayIndex >= 0 && dayIndex < 5) {
            // Take maximum values if multiple risk areas affect same day/source
            const current = matrix[dayIndex][sourceIndex]
            matrix[dayIndex][sourceIndex] = [
              Math.max(current[0], impact),
              Math.max(current[1], likelihood)
            ]
          }
        })
      }
    }
  }

  riskAreaIntersectsLocation (riskAreaBlock) {
    if (!this.location || !this.location.bbox2k) {
      return false // Should not be called without location, but safety check
    }

    const locationBbox = this.location.bbox2k
    const locationPolygon = turf.bboxPolygon(locationBbox)

    // Check if any polygon in this risk area block intersects with the location
    for (const poly of riskAreaBlock.polys) {
      try {
        let riskAreaPolygon

        if (poly.poly_type === 'inland' && poly.coordinates && poly.coordinates.length > 0) {
          // Inland polygons are already polygons
          riskAreaPolygon = turf.polygon(poly.coordinates)
        } else if (poly.poly_type === 'coastal' && poly.coordinates && poly.coordinates.length > 0) {
          // Coastal areas are linestrings, convert to polygon with buffer
          const lineString = turf.lineString(poly.coordinates[0])
          riskAreaPolygon = turf.buffer(lineString, 1, { units: 'miles' })
        }

        if (riskAreaPolygon && turf.intersect(locationPolygon, riskAreaPolygon)) {
          return true // Found intersection
        }
      } catch (error) {
        // Skip malformed polygons and continue checking others
        continue
      }
    }

    return false // No intersection found
  }
}
