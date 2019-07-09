const turf = require('turf')
const polygonSmooth = require('@turf/polygon-smooth')

function processOutlookData (outlook) {
  // Has concern areas flag
  let hasOutlookConcern = false

  // Issued date
  const timestampOutlook = (new Date(outlook.issued_at)).getTime()

  // Highest daily risk
  const riskLevels = [0, 0, 0, 0, 0]

  // Build outlook GeoJSON
  const lookup = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]
  const geoJson = {
    type: 'FeatureCollection',
    features: []
  }

  outlook.risk_areas.forEach((riskArea) => {
    riskArea.risk_area_blocks.forEach(riskAreaBlock => {
      let rImpact = 0
      let rLikelyhood = 0
      let sImpact = 0
      let sLikelyhood = 0
      let cImpact = 0
      let cLikelyhood = 0
      let rRisk = 0
      let sRisk = 0
      let cRisk = 0

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
      const riskLevel = Math.max(rRisk, sRisk, cRisk)

      // Set hasOutlookConcern flag
      if (riskLevel > 0) {
        hasOutlookConcern = true
      }

      // Calculate feature z index
      const zIndex = riskArea.ordering + riskLevel

      riskAreaBlock.days.forEach(day => {
        riskAreaBlock.polys.forEach(poly => {
          const feature = {
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

  let full = outlook.public_forecast.english_forecast
  full = '<p class="govuk-body">' + full + '</p>'
  full = full.replace(/\r\n\r\n/g, '</p><p class="govuk-body">').replace(/\n\n/g, '</p><p class="govuk-body">')
  full = full.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />')

  let headline = outlook.headline
  headline = '<p class="govuk-body">' + headline + '</p>'

  return { timestampOutlook, hasOutlookConcern, geoJson, riskLevels, full, headline }
}

module.exports = processOutlookData
