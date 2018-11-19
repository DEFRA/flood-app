const hoek = require('hoek')
const turf = require('turf')
const polygonSmooth = require('@turf/polygon-smooth')
const BaseViewModel = require('.')

const defaults = {
  pageTitle: `Outlook for England - GOV.UK`,
  metadata: {
    keywords: '...',
    description: '...'
  }
}

class ViewModel extends BaseViewModel {
  constructor (options) {
    const { outlook } = options
    const data = getData(outlook)
    super(hoek.applyToDefaults(defaults, options))

    const issueDate = new Date(outlook.issued_at)
    const date = issueDate.getDate()
    const days = [0, 1, 2, 3, 4].map(i => {
      return {
        idx: i + 1,
        level: data.riskLevels[i],
        date: new Date(issueDate.setDate(date + i))
      }
    })

    this.days = days
    this.geoJson = data.geoJson
  }
}

module.exports = ViewModel

function getData (outlook) {
  // Highest daily risk
  var riskLevels = [0, 0, 0, 0, 0]

  // Build outlook GeoJSON
  var lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]
  var geoJson = {
    type: 'FeatureCollection',
    features: []
  }

  outlook.risk_areas.forEach((riskArea) => {
    riskArea.risk_area_blocks.forEach((riskAreaBlock, i) => {
      var rImpact = 0
      var rLikelyhood = 0
      var sImpact = 0
      var sLikelyhood = 0
      var cImpact = 0
      var cLikelyhood = 0
      var rRisk = 0
      var sRisk = 0
      var cRisk = 0

      if (riskAreaBlock.risk_levels.river) {
        rImpact = riskAreaBlock.risk_levels.river[0]
        rLikelyhood = riskAreaBlock.risk_levels.river[1]
        rRisk = lookup[rImpact - 1][rLikelyhood - 1]
      }
      if (riskAreaBlock.risk_levels.surface) {
        sImpact = riskAreaBlock.risk_levels.surface[0]
        sLikelyhood = riskAreaBlock.risk_levels.surface[1]
        sRisk = lookup[sImpact - 1][sLikelyhood - 1]
      }
      if (riskAreaBlock.risk_levels.coastal) {
        cImpact = riskAreaBlock.risk_levels.coastal[0]
        cLikelyhood = riskAreaBlock.risk_levels.coastal[1]
        cRisk = lookup[cImpact - 1][cLikelyhood - 1]
      }
      var riskLevel = Math.max(rRisk, sRisk, cRisk)

      // Calculate feature z index
      var zIndex = riskArea.ordering + riskLevel

      riskAreaBlock.days.forEach(day => {
        riskAreaBlock.polys.forEach((poly, i) => {
          var feature = {
            'type': 'Feature',
            'properties': {
              'type': 'concernArea',
              'day': day,
              'risk-level': riskLevel,
              'z-index': zIndex,
              'html': '<p class="govuk-body-s">Details of source, likelyhood and impact</p>'
            }
          }
          if (poly.poly_type === 'inland') {
            feature.geometry = {
              'type': 'Polygon',
              'coordinates': poly.coordinates
            }
            feature.properties.polyType = 'inland'
          } else if (poly.poly_type === 'coastal') {
            feature.geometry = {
              'type': 'LineString',
              'coordinates': poly.coordinates
            }
            feature.properties.polyType = 'coastal'
            // Put coastal areas on top of inland areas
            feature.properties['z-index'] = zIndex + 10
          }
          geoJson.features.push(feature)

          // Set highest daily risk level
          if (riskLevel > riskLevels[day - 1]) {
            riskLevels[day - 1] = riskLevel
          }
        })
      })
    })
  })

  // Smooth outlook polygons
  geoJson.features.forEach((feature) => {
    // Turf library used to create extra coordinates for Polygons
    if (feature.geometry.type === 'Polygon') {
      const smoothed = polygonSmooth(feature, { iterations: 4 })
      const coordinates = smoothed.features[0].geometry.coordinates
      feature.geometry.coordinates = coordinates
      feature.properties.isSmooth = true
    }

    // Convert linestrings to polygons
    if (feature.geometry.type === 'LineString') {
      const buffer = turf.buffer(feature, 3, 'miles')
      const coordinates = buffer.geometry.coordinates
      feature.geometry.type = 'Polygon'
      feature.geometry.coordinates = coordinates
    }
  })

  return { geoJson, riskLevels }
}
