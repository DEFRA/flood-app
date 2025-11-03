const turf = require('@turf/turf')
const { IMPACT, LIKELIHOOD, CONFIG, CONTENT } = require('./outlook-constants')

// Risk level constants to avoid magic numbers
const VERY_LOW = LIKELIHOOD.VeryLow
const LOW = LIKELIHOOD.Low
const MEDIUM = LIKELIHOOD.Medium
const HIGH = LIKELIHOOD.High

// Impact and likelihood constants
const IMPACT_LOW = IMPACT.Minimal
const IMPACT_MEDIUM = IMPACT.Minor
const LIKELIHOOD_LOW = LIKELIHOOD.VeryLow

// Number of outlook days
const OUTLOOK_DAYS = CONFIG.DAYS_COUNT

// Class that processes flood outlook data and creates GeoJSON features for mapping
// Takes raw flood risk data and converts it into visual map layers showing:
// - Flood risk areas as polygons/linestrings
// - Risk levels (very low, low, medium, high)
// - Affected sources (rivers, surface water, coastal, groundwater)
// - Time periods when risks apply
class OutlookMap {
  // Constructor: Takes raw outlook data and builds the map-ready GeoJSON
  // Handles data validation, risk level calculation, and geographic feature creation
  constructor (outlook, logger = console) {
    // Validate input data - if empty or invalid, mark as error and stop
    if (!outlook || Object.keys(outlook).length === 0 || this.dataError) {
      this.dataError = true
      return
    }
    this._outlook = outlook

    // Flag to track if there are any flood concerns in the outlook
    this._hasOutlookConcern = false
    this._outOfDate = true

    // Array to track the highest risk level for each of the 5 outlook days
    this._riskLevels = new Array(OUTLOOK_DAYS).fill(0)

    // Initialize empty GeoJSON structure for map features
    const riskMatrix = [[VERY_LOW, VERY_LOW, VERY_LOW, VERY_LOW], [VERY_LOW, VERY_LOW, LOW, LOW], [LOW, LOW, MEDIUM, MEDIUM], [LOW, MEDIUM, MEDIUM, HIGH]]
    const riskBands = ['Very low', 'Low', 'Medium', 'High']

    this._geoJson = {
      type: 'FeatureCollection',
      features: []
    }

    try {
      // Process all risk areas and build GeoJSON features
      this.outlookRiskAreas(outlook, riskMatrix, riskBands)
      this.dataError = false

      // Store when this outlook data was issued
      this._timestampOutlook = (new Date(outlook.issued_at)).getTime()
    } catch (err) {
      // Log any processing errors but don't crash the app
      logger.warn({
        situation: 'Outlook FGS data error - outlook: ' + err.message,
        err
      })
      this.dataError = true
      return
    }

    // Convert coastal linestrings to polygons for better map display
    for (const feature of this._geoJson.features) {
      if (feature.geometry.type === 'LineString') {
        // Add 1-mile buffer around coastlines to create visible polygons
        const buffer = turf.buffer(feature, 1, { units: 'miles' })
        const coordinates = buffer.geometry.coordinates
        feature.geometry.type = 'Polygon'
        feature.geometry.coordinates = coordinates
      }
    }

    // Split the full England forecast text into paragraphs
    this._full = outlook.public_forecast.england_forecast.split('\n\n')

    // Build day objects with dates and risk levels for each outlook day
    const issueDate = new Date(outlook.issued_at)
    this._days = Array.from({ length: OUTLOOK_DAYS }, (_, i) => {
      const date = new Date(issueDate)
      return {
        idx: i + 1, // 1-based day index
        level: this._riskLevels[i], // Highest risk level for this day
        date: new Date(date.setDate(date.getDate() + i)) // Actual date
      }
    })
  }

  // Main processing method: Converts risk area data into GeoJSON map features
  // Goes through each risk area and block, calculates overall risk levels,
  // and creates map features for visualization
  outlookRiskAreas (outlook, riskMatrix, riskBands) {
    // Process each risk area in the outlook data
    for (const riskArea of outlook.risk_areas) {
      for (const riskAreaBlock of riskArea.risk_area_blocks) {
        // Initialize variables to track risk data for each source type
        let sources = [] // List of affected sources (for display)
        let rImpact = 0; let rLikelihood = 0 // River risk values
        let sImpact = 0; let sLikelihood = 0 // Surface water risk values
        let cImpact = 0; let cLikelihood = 0 // Coastal risk values
        let gImpact = 0; let gLikelihood = 0 // Groundwater risk values
        let rRisk = 0; let sRisk = 0; let cRisk = 0; let gRisk = 0 // Calculated risk levels

        // Extract and calculate risk levels for each source type
        if (riskAreaBlock.risk_levels.river) {
          rImpact = riskAreaBlock.risk_levels.river[0]
          rLikelihood = riskAreaBlock.risk_levels.river[1]
          rRisk = riskMatrix[rImpact - 1][rLikelihood - 1] // Look up in risk matrix
          sources.push('river')
        }
        if (riskAreaBlock.risk_levels.surface) {
          sImpact = riskAreaBlock.risk_levels.surface[0]
          sLikelihood = riskAreaBlock.risk_levels.surface[1]
          sRisk = riskMatrix[sImpact - 1][sLikelihood - 1]
          sources.push('surface water')
        }
        if (riskAreaBlock.risk_levels.ground) {
          gImpact = riskAreaBlock.risk_levels.ground[0]
          gLikelihood = riskAreaBlock.risk_levels.ground[1]
          gRisk = riskMatrix[gImpact - 1][gLikelihood - 1]
          sources.push('ground water')
        }
        if (riskAreaBlock.risk_levels.coastal) {
          cImpact = riskAreaBlock.risk_levels.coastal[0]
          cLikelihood = riskAreaBlock.risk_levels.coastal[1]
          cRisk = riskMatrix[cImpact - 1][cLikelihood - 1]
          sources.push('coastal')
        }

        // Calculate overall risk level as the highest across all sources
        const riskLevel = Math.max(rRisk, sRisk, cRisk, gRisk)
        const impactLevel = Math.max(rImpact, sImpact, cImpact, gImpact)
        const likelihoodLevel = Math.max(rLikelihood, sLikelihood, cLikelihood, gLikelihood)

        // Build human-readable source description (e.g., "rivers and surface water")
        sources = sources.length > 1 ? `${sources.slice(0, -1).join(', ')} and ${sources.at(-1)}` : sources

        // Create feature name like "Medium risk of river flooding"
        const featureName = `${riskBands[riskLevel - 1]} risk of ${sources} flooding`

        // Set flag if there are any flood concerns in this outlook
        if (riskLevel > 0) {
          this._hasOutlookConcern = true
        }

        // Create unique keys for each source's risk combination
        const rKey = [rRisk, `i${rImpact}`, `l${rLikelihood}`].join('-')
        const sKey = [sRisk, `i${sImpact}`, `l${sLikelihood}`].join('-')
        const cKey = [cRisk, `i${cImpact}`, `l${cLikelihood}`].join('-')
        const gKey = [gRisk, `i${gImpact}`, `l${gLikelihood}`].join('-')

        // Build detailed messages for each risk combination
        const messageGroupObj = this.expandSourceDescription(rKey, sKey, cKey, gKey)

        // Create the actual GeoJSON features for the map
        this.generatePolyFeature(riskAreaBlock, featureName, messageGroupObj, riskLevel, impactLevel, likelihoodLevel)
      }
    }
  }

  // Takes risk keys for each source and builds detailed descriptions
  // Groups sources with the same risk level and creates human-readable messages
  // Example: Turns "2-i2-l3" into "Medium risk from overflowing rivers and runoff from rainfall"
  expandSourceDescription (rKey, sKey, cKey, gKey) {
    const messageGroupObj = {}

    // Full descriptions for each source type (more detailed than just "river")
    const expandedSource = [
      'overflowing rivers', // river
      'runoff from rainfall or blocked drains', // surface
      'high tides or large waves', // coastal
      'a high water table' // ground
    ]

    // Process each source's risk key
    const keyArr = [rKey, sKey, cKey, gKey]
    for (const [pos, key] of keyArr.entries()) {
      if (messageGroupObj[key]) {
        // If this risk level already exists, add this source to it
        messageGroupObj[key].sources.push(expandedSource[pos])
      } else {
        // Create new entry for this risk level
        messageGroupObj[key] = {
          sources: [expandedSource[pos]],
          message: CONTENT.MAP_MESSAGE[key] // Get pre-written message from constants
        }
      }
    }

    // Combine multiple sources into readable format (e.g., "rivers and surface water")
    for (const [messageId, messageObj] of Object.entries(messageGroupObj)) {
      if (messageObj.sources.length > 1) {
        const lastSource = messageObj.sources.pop() // Remove last source
        // Join remaining sources with commas, then add "and" before last
        messageGroupObj[messageId].sources[0] = `${messageObj.sources.slice(0).join(', ')} and ${lastSource}`
      }
    }

    // Remove empty risk entries (no risk)
    delete messageGroupObj['0-i0-l0']
    return messageGroupObj
  }

  // Creates GeoJSON features for each polygon in the risk area block
  // These features will be displayed on the map with appropriate styling and popups
  generatePolyFeature (riskAreaBlock, featureName, messageGroupObj, riskLevel, impactLevel, likelihoodLevel) {
    // Process each polygon in this risk area block
    for (const poly of riskAreaBlock.polys) {
      // Create the basic GeoJSON feature structure
      const feature = {
        type: 'Feature',
        id: poly.id,
        properties: {
          type: 'concernArea', // Identifies this as a flood concern area
          days: riskAreaBlock.days, // Which days this risk applies to
          labelPosition: poly.label_position, // Where to place labels on map
          name: featureName, // Human-readable name like "Medium risk of river flooding"
          message: messageGroupObj, // Detailed risk descriptions for popups
          'risk-level': riskLevel, // Numeric risk level for styling
          'z-index': (riskLevel * 10) // Drawing order (higher risks on top)
        }
      }

      // Handle inland flood areas (stored as polygons)
      if (poly.poly_type === 'inland') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: poly.coordinates
        }
        feature.properties.polyType = 'inland'

      // Handle coastal flood areas (stored as linestrings representing coastlines)
      } else if (poly.poly_type === 'coastal') {
        feature.geometry = {
          type: 'LineString',
          coordinates: poly.coordinates
        }
        feature.properties.polyType = 'coastal'
        // Put coastal areas on top of inland areas for better visibility
        feature.properties['z-index'] += 1
      } else {
        // Unknown polygon type, skip this one
        return
      }

      // Only add features that have meaningful risk levels
      // Skip very low impact risks unless they have higher likelihood
      if (impactLevel > IMPACT_LOW && !(impactLevel === IMPACT_MEDIUM && likelihoodLevel === LIKELIHOOD_LOW)) {
        this._geoJson.features.push(feature)
      }

      // Update the highest daily risk levels
      for (const day of riskAreaBlock.days) {
        if (riskLevel > this._riskLevels[day - 1]) {
          this._riskLevels[day - 1] = riskLevel
        }
      }
    }
  }

  // Getter methods to access processed outlook data
  get issueDate () {
    return new Date(this._outlook.issued_at)
  }

  get timestampOutlook () {
    return this._timestampOutlook
  }

  get hasOutlookConcern () {
    return this._hasOutlookConcern
  }

  get geoJson () {
    return this._geoJson
  }

  get riskLevels () {
    return this._riskLevels
  }

  get full () {
    return this._full
  }

  get days () {
    return this._days
  }

  get outOfDate () {
    return this._outOfDate
  }
}

module.exports = OutlookMap
