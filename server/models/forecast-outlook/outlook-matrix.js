const MATRIX_DAYS = 5

const turf = require('@turf/turf')

// Class that converts raw flood outlook data into a 5×4×2 risk matrix
// Matrix format: [day][source][impact, likelihood]
// - 5 days (today + 4 future days)
// - 4 sources: river, coastal, surface water, groundwater
// - 2 values: impact level + likelihood level
module.exports = class OutlookMatrix {
  // Constructor takes raw outlook data and optional location for filtering
  constructor (outlook, location = null) {
    this.outlook = outlook
    this.location = location
  }

  // Main method: Returns the 5×4×2 risk matrix for the given outlook and location
  // If location provided, only includes risk areas that affect that location
  get matrixData () {
    // Create empty 5×4 matrix initialized with [0, 0] for each source
    // Format: matrix[dayIndex][sourceIndex] = [impact, likelihood]
    const matrix = Array(MATRIX_DAYS).fill().map(() =>
      Array(4).fill().map(() => [0, 0])
    )

    // Map source names to array positions: river=0, coastal=1, surface=2, ground=3
    const sourceMap = {
      river: 0,
      coastal: 1,
      surface: 2,
      ground: 3
    }

    // Process risk areas that intersect with the location (only if location exists)
    if (this.location?.bbox2k && this.outlook?.risk_areas) {
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

  // Takes one risk area block and updates the matrix with its risk levels
  // Risk area blocks contain flood risk data for specific geographic areas and time periods
  processRiskAreaBlock (riskAreaBlock, matrix, sourceMap) {
    // Process each source type in the risk levels (river, coastal, surface, ground)
    for (const [sourceKey, [impact, likelihood]] of Object.entries(riskAreaBlock.risk_levels)) {
      const sourceIndex = sourceMap[sourceKey]
      if (sourceIndex === undefined) {
        continue // Skip unknown source types
      }

      // Apply this risk level to each day that this risk area block covers
      riskAreaBlock.days.forEach(day => {
        const dayIndex = day - 1 // Convert 1-based day to 0-based index
        if (dayIndex >= 0 && dayIndex < MATRIX_DAYS) {
          // Take maximum values if multiple risk areas affect same day/source
          // This ensures we don't lose higher risk levels
          const current = matrix[dayIndex][sourceIndex]
          matrix[dayIndex][sourceIndex] = [
            Math.max(current[0], impact),
            Math.max(current[1], likelihood)
          ]
        }
      })
    }
  }

  // Checks if a risk area block affects the user's location using geographic intersection
  // This filters out flood risks that don't apply to the specific area the user cares about
  riskAreaIntersectsLocation (riskAreaBlock) {
    if (!this.location?.bbox2k) {
      return false // Should not be called without location, but safety check
    }

    // Convert location's bounding box into a polygon for intersection testing
    const locationBbox = this.location.bbox2k
    const locationPolygon = turf.bboxPolygon(locationBbox)

    // Check if any polygon in this risk area block intersects with the location
    for (const poly of riskAreaBlock.polys) {
      let riskAreaPolygon = null

      if (poly.poly_type === 'inland' && this.isValidPolygonCoordinates(poly.coordinates)) {
        // Inland flood areas are stored as polygons - use them directly
        riskAreaPolygon = turf.polygon(poly.coordinates)
      } else if (poly.poly_type === 'coastal' && this.isValidLineStringCoordinates(poly.coordinates?.[0])) {
        // Coastal flood areas are stored as linestrings (coastlines)
        // Convert to polygon by adding a 1-mile buffer around the coastline
        const lineString = turf.lineString(poly.coordinates[0])
        riskAreaPolygon = turf.buffer(lineString, 1, { units: 'miles' })
      } else {
        // Skip unknown poly_type or invalid coordinates
        continue
      }

      // Check if this risk area polygon intersects with the user's location
      if (riskAreaPolygon && turf.intersect(locationPolygon, riskAreaPolygon)) {
        return true // Found intersection - this risk area affects the location
      }
    }

    return false // No intersection found - this risk area doesn't affect the location
  }

  // Helper to validate polygon coordinates (array of rings, each ring is array of [lng, lat])
  // Ensures coordinates are properly formatted numbers and not NaN
  isValidPolygonCoordinates (coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return false
    }
    return coordinates.every(ring =>
      Array.isArray(ring) && ring.length > 0 &&
      ring.every(coord => Array.isArray(coord) && coord.length >= 2 &&
        typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
        !isNaN(coord[0]) && !isNaN(coord[1])
      )
    )
  }

  // Helper to validate linestring coordinates (array of [lng, lat])
  // Linestrings need at least 2 points to be valid
  isValidLineStringCoordinates (coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return false
    }
    return coordinates.every(coord => Array.isArray(coord) && coord.length >= 2 &&
      typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
      !isNaN(coord[0]) && !isNaN(coord[1])
    )
  }
}
