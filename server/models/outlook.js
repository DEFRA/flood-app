const turf = require('@turf/turf')
const messageContent = require('./outlook-content.json')

class Outlook {
  constructor (outlook) {
    if (!outlook || Object.keys(outlook).length === 0) {
      this.dataError = true
      return
    }
    this._outlook = outlook
    // Has concern areas flag
    this._hasOutlookConcern = false
    this._outOfDate = true

    // Highest daily risk
    this._riskLevels = [0, 0, 0, 0, 0]

    // Build outlook GeoJSON
    const riskMatrix = [[1, 1, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3], [2, 3, 3, 4]]
    const riskBands = ['Very low', 'Low', 'Medium', 'High']

    this._geoJson = {
      type: 'FeatureCollection',
      features: []
    }
    try {
      this.outlookRiskAreas(outlook, riskMatrix, riskBands)
      this.dataError = false

      // Issued date
      this._timestampOutlook = (new Date(outlook.issued_at)).getTime()
    } catch (err) {
      console.error('Outlook FGS data error - outlook: ', err)
      this.dataError = true
      return
    }

    this._geoJson.features.forEach((feature) => {
      // Convert linestrings to polygons
      if (feature.geometry.type === 'LineString') {
        const buffer = turf.buffer(feature, 1, { units: 'miles' })
        const coordinates = buffer.geometry.coordinates
        feature.geometry.type = 'Polygon'
        feature.geometry.coordinates = coordinates
      }
    })

    this._full = outlook.public_forecast.english_forecast

    const issueDate = new Date(outlook.issued_at)

    this._days = [0, 1, 2, 3, 4].map(i => {
      const date = new Date(issueDate)
      return {
        idx: i + 1,
        level: this._riskLevels[i],
        date: new Date(date.setDate(date.getDate() + i))
      }
    })
  }

  outlookRiskAreas (outlook, riskMatrix, riskBands) {
    outlook.risk_areas.forEach(riskArea => {
      riskArea.risk_area_blocks.forEach(riskAreaBlock => {
        let sources = []
        let rImpact = 0
        let rLikelihood = 0
        let sImpact = 0
        let sLikelihood = 0
        let cImpact = 0
        let cLikelihood = 0
        let gImpact = 0
        let gLikelihood = 0
        let rRisk = 0
        let sRisk = 0
        let cRisk = 0
        let gRisk = 0

        if (riskAreaBlock.risk_levels.river) {
          rImpact = riskAreaBlock.risk_levels.river[0]
          rLikelihood = riskAreaBlock.risk_levels.river[1]
          rRisk = riskMatrix[rImpact - 1][rLikelihood - 1]
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

        const riskLevel = Math.max(rRisk, sRisk, cRisk, gRisk)
        const impactLevel = Math.max(rImpact, sImpact, cImpact, gImpact)
        const likelihoodLevel = Math.max(rLikelihood, sLikelihood, cLikelihood, gLikelihood)

        // Build up sources string and feature name
        sources = sources.length > 1 ? `${sources.slice(0, -1).join(', ')} and ${sources[sources.length - 1]}` : sources

        const featureName = `${riskBands[riskLevel - 1]} risk of ${sources} flooding`

        // Set hasOutlookConcern flag
        if (riskLevel > 0) {
          this._hasOutlookConcern = true
        }

        const rKey = [rRisk, `i${rImpact}`, `l${rLikelihood}`].join('-')
        const sKey = [sRisk, `i${sImpact}`, `l${sLikelihood}`].join('-')
        const cKey = [cRisk, `i${cImpact}`, `l${cLikelihood}`].join('-')
        const gKey = [gRisk, `i${gImpact}`, `l${gLikelihood}`].join('-')

        const messageGroupObj = this.expandSourceDescription(rKey, sKey, cKey, gKey)

        this.generatePolyFeature(riskAreaBlock, featureName, messageGroupObj, riskLevel, impactLevel, likelihoodLevel)
      })
    })
  }

  expandSourceDescription (rKey, sKey, cKey, gKey) {
    const messageGroupObj = {}

    const expandedSource = [
      'overflowing rivers',
      'runoff from rainfall or blocked drains',
      'a high water table',
      'high tides or large waves'
    ]

    const keyArr = [rKey, sKey, cKey, gKey]

    for (const [pos, key] of keyArr.entries()) {
      if (messageGroupObj[key]) {
        messageGroupObj[key].sources.push(expandedSource[pos])
      } else {
        messageGroupObj[key] = { sources: [expandedSource[pos]], message: messageContent[key] }
      }
    }

    for (const [messageId, messageObj] of Object.entries(messageGroupObj)) {
      if (messageObj.sources.length > 1) {
        const lastSource = messageObj.sources.pop()
        messageGroupObj[messageId].sources[0] = `${messageObj.sources.slice(0).join(', ')} and ${lastSource}`
      }
    }

    delete messageGroupObj['0-i0-l0']
    return messageGroupObj
  }

  generatePolyFeature (riskAreaBlock, featureName, messageGroupObj, riskLevel, impactLevel, likelihoodLevel) {
    riskAreaBlock.polys.forEach(poly => {
      const feature = {
        type: 'Feature',
        id: poly.id,
        properties: {
          type: 'concernArea',
          days: riskAreaBlock.days,
          labelPosition: poly.label_position,
          name: featureName,
          message: messageGroupObj,
          'risk-level': riskLevel,
          'z-index': (riskLevel * 10)
        }
      }

      if (poly.poly_type === 'inland') {
        feature.geometry = {
          type: 'Polygon',
          coordinates: poly.coordinates
        }
        feature.properties.polyType = 'inland'
      } else if (poly.poly_type === 'coastal') {
        feature.geometry = {
          type: 'LineString',
          coordinates: poly.coordinates
        }
        feature.properties.polyType = 'coastal'
        // Put coastal areas on top of inland areas
        feature.properties['z-index'] += 1
      }
      if (impactLevel > 1 && !(impactLevel === 2 && likelihoodLevel === 1)) {
        this._geoJson.features.push(feature)
      }

      // Set highest daily risk level
      riskAreaBlock.days.forEach(day => {
        if (riskLevel > this._riskLevels[day - 1]) {
          this._riskLevels[day - 1] = riskLevel
        }
      })
    })
  }

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

module.exports = Outlook
