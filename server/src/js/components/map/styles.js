'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke } from 'ol/style'

window.flood.maps.styles = {

  //
  // Vector styles
  //

  targetAreaPolygons: (feature) => {
    // Use corresposnding warning feature propeties for styling
    const warningsSource = window.flood.maps.warningsSource
    let warningId = feature.getId()
    if (warningId.includes('flood_warning_alert')) {
      // Transform id if vector source
      warningId = 'flood' + feature.getId().substring(feature.getId().indexOf('.'))
    } else {
      // Transform id if vector tile source
      warningId = 'flood.' + feature.getId()
    }
    const warning = warningsSource.getFeatureById(warningId)
    if (!warning || warning.get('isVisible') !== 'true') {
      return new Style()
    }

    const severity = warning.get('severity_value')
    const isSelected = warning.get('isSelected')
    const isGroundwater = warning.getId().substring(6, 9) === 'FAG'

    // Defaults
    let strokeColour = 'transparent'
    let fillColour = 'transparent'
    let zIndex = 1

    switch (severity) {
      case 3: // Severe warning
        strokeColour = '#D4351C'
        fillColour = pattern('severe')
        zIndex = 11
        break
      case 2: // Warning
        strokeColour = '#D4351C'
        fillColour = pattern('warning')
        zIndex = 10
        break
      case 1: // Alert
        strokeColour = '#F47738'
        fillColour = pattern('alert')
        zIndex = isGroundwater ? 4 : 7
        break
      default: // Removed or inactive
        strokeColour = '#626A6E'
        fillColour = pattern('removed')
        zIndex = 1
    }
    zIndex = isSelected ? zIndex + 2 : zIndex

    const selectedStroke = new Style({ stroke: new Stroke({ color: '#FFDD00', width: 16 }), zIndex: zIndex })
    const stroke = new Style({ stroke: new Stroke({ color: strokeColour, width: 2 }), zIndex: zIndex })
    const fill = new Style({ fill: new Fill({ color: fillColour }), zIndex: zIndex })

    if (isSelected) {
      return [selectedStroke, stroke, fill]
    } else {
      return [stroke, fill]
    }
  },

  warnings: (feature, resolution) => {
    // Hide warning symbols or hide when polygon is shown
    if (feature.get('isVisible') !== 'true' || resolution < window.flood.maps.liveMaxBigZoom) {
      return
    }
    const severity = feature.get('severity_value')
    const isSelected = feature.get('isSelected')
    switch (severity) {
      case 3: // Severe warning
        return isSelected ? styleCache.severeSelected : styleCache.severe
      case 2: // Warning
        return isSelected ? styleCache.warningSelected : styleCache.warning
      case 1: // Alert
        return isSelected ? styleCache.alertSelected : styleCache.alert
      default: // Removed or inactive
        return isSelected ? styleCache.targetAreaSelected : styleCache.targetArea
    }
  },

  stations: (feature, resolution) => {
    if (feature.get('isVisible') !== 'true') {
      return
    }
    const state = feature.get('state')
    const isSelected = feature.get('isSelected')
    const isBigSymbol = resolution <= window.flood.maps.liveMaxBigZoom
    switch (state) {
      case 'high':
        return isSelected ? (isBigSymbol ? styleCache.levelHighBigSelected : styleCache.levelHighSelected) : (isBigSymbol ? styleCache.levelHighBig : styleCache.levelHigh)
      case 'error':
        return isSelected ? (isBigSymbol ? styleCache.levelErrorBigSelected : styleCache.levelErrorSelected) : (isBigSymbol ? styleCache.levelErrorBig : styleCache.levelError)
      default:
        return isSelected ? (isBigSymbol ? styleCache.levelBigSelected : styleCache.levelSelected) : (isBigSymbol ? styleCache.levelBig : styleCache.level)
    }
  },

  impacts: (feature, resolution) => {
    if (feature.get('isVisible') !== 'true') {
      return
    }
    const isSelected = feature.get('isSelected')
    return isSelected ? styleCache.impactSelected : styleCache.impact
  },

  rainfall: (feature, resolution) => {
    if (feature.get('isVisible') !== 'true') {
      return
    }
    const isSelected = feature.get('isSelected')
    const isBigSymbol = resolution <= window.flood.maps.liveMaxBigZoom
    return isSelected ? (isBigSymbol ? styleCache.rainfallBigSelected : styleCache.rainfallSelected) : (isBigSymbol ? styleCache.rainfallBig : styleCache.rainfall)
  },

  //
  // WebGL styles
  //

  warningsJSON: {
    filter: ['case',
      ['<', ['resolution'], 100],
      false,
      ['case',
        ['==', ['get', 'isVisible'], 'true'],
        true,
        false
      ]
    ],
    symbol: {
      symbolType: 'image',
      src: '/assets/images/map-symbols-2x.png',
      size: 50,
      rotateWithView: false,
      offset: [0, 0],
      textureCoord: ['match', ['get', 'severity_value'],
        3, [0, 0, 0.5, 0.0769],
        2, [0, 0.0769, 0.5, 0.1538],
        1, [0, 0.1538, 0.5, 0.2307],
        [0, 0.2307, 0.5, 0.3077]
      ]
    }
  },

  stationsJSON: {
    filter: ['==', ['get', 'isVisible'], 'true'],
    symbol: {
      symbolType: 'image',
      src: '/assets/images/map-symbols-2x.png',
      size: 50,
      rotateWithView: false,
      offset: [0, 0],
      textureCoord: ['match', ['get', 'state'],
        'high', ['case', ['<=', ['resolution'], 100], [0, 0.3846, 0.5, 0.4615], [0, 0.6923, 0.5, 0.7692]],
        'error', ['case', ['<=', ['resolution'], 100], [0, 0.5385, 0.5, 0.6158], [0, 0.8462, 0.5, 0.9231]],
        ['case', ['<=', ['resolution'], 100], [0, 0.4615, 0.5, 0.5385], [0, 0.7692, 0.5, 0.8462]]
      ]
    }
  },

  rainfallJSON: {
    filter: ['==', ['get', 'isVisible'], 'true'],
    symbol: {
      symbolType: 'image',
      src: '/assets/images/map-symbols-2x.png',
      size: 50,
      rotateWithView: false,
      offset: [0, 0],
      textureCoord: ['case', ['<=', ['resolution'], 100], [0, 0.6154, 0.5, 0.6923], [0, 0.9231, 0.5, 1]]
    }
  },

  impactsJSON: {
    filter: ['==', ['get', 'isVisible'], 'true'],
    symbol: {
      symbolType: 'image',
      src: '/assets/images/map-symbols-2x.png',
      size: 50,
      rotateWithView: false,
      offset: [0, 0],
      textureCoord: [0, 0.3077, 0.5, 0.3846]
    }
  }
}

const pattern = (style) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (style) {
    case 'severe':
      ctx.fillStyle = '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(0, 4.7)
      ctx.closePath()
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(8, 4.7)
      ctx.closePath()
      ctx.fill()
      break
    case 'warning':
      ctx.fillStyle = '#D4351C'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.moveTo(3.3, 0)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(0, 3.3)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.moveTo(4.7, 0)
      ctx.lineTo(8, 3.3)
      ctx.lineTo(7.3, 4)
      ctx.lineTo(4, 0.7)
      ctx.closePath()
      ctx.moveTo(0, 4.7)
      ctx.lineTo(3.3, 8)
      ctx.lineTo(4, 7.3)
      ctx.lineTo(0.7, 4)
      ctx.closePath()
      ctx.fill()
      break
    case 'alert':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#F47738'
      ctx.moveTo(0, 3.3)
      ctx.lineTo(0, 4.7)
      ctx.lineTo(4.7, 0)
      ctx.lineTo(3.3, 0)
      ctx.closePath()
      ctx.moveTo(3.3, 8)
      ctx.lineTo(4.7, 8)
      ctx.lineTo(8, 4.7)
      ctx.lineTo(8, 3.3)
      ctx.closePath()
      ctx.fill()
      break
    case 'removed':
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#626A6E'
      ctx.arc(4, 4, 1, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      break
  }
  ctx.restore()
  return ctx.createPattern(canvas, 'repeat')
}

//
// Style caching
//

const createStyle = (options) => {
  const defaults = {
    size: [100, 100],
    anchor: [0.5, 0.5],
    offset: [0, 0],
    scale: 0.5,
    zIndex: 1
  }
  options = Object.assign({}, defaults, options)
  return new Style({
    image: new Icon({
      src: '/assets/images/map-symbols-2x.png',
      size: options.size,
      anchor: options.anchor,
      offset: options.offset,
      scale: options.scale
    }),
    zIndex: options.zIndex
  })
}

const styleCache = {
  severe: createStyle({ offset: [0, 0], zIndex: 5 }),
  severeSelected: createStyle({ offset: [100, 0], zIndex: 10 }),
  warning: createStyle({ offset: [0, 100], zIndex: 4 }),
  warningSelected: createStyle({ offset: [100, 100], zIndex: 10 }),
  alert: createStyle({ offset: [0, 200], zIndex: 3 }),
  alertSelected: createStyle({ offset: [100, 200], zIndex: 10 }),
  targetArea: createStyle({ offset: [0, 300], zIndex: 1 }),
  targetAreaSelected: createStyle({ offset: [100, 300], zIndex: 10 }),
  impact: createStyle({ offset: [0, 400], zIndex: 1 }),
  impactSelected: createStyle({ offset: [100, 400], zIndex: 10 }),
  levelHighBig: createStyle({ offset: [0, 500], zIndex: 3 }),
  levelHighBigSelected: createStyle({ offset: [100, 500], zIndex: 10 }),
  levelBig: createStyle({ offset: [0, 600], zIndex: 2 }),
  levelBigSelected: createStyle({ offset: [100, 600], zIndex: 10 }),
  levelErrorBig: createStyle({ offset: [0, 700], zIndex: 1 }),
  levelErrorBigSelected: createStyle({ offset: [100, 700], zIndex: 10 }),
  rainfallBig: createStyle({ offset: [0, 800], zIndex: 1 }),
  rainfallBigSelected: createStyle({ offset: [100, 800], zIndex: 10 }),
  levelHigh: createStyle({ offset: [0, 900], zIndex: 3 }),
  levelHighSelected: createStyle({ offset: [100, 900], zIndex: 10 }),
  level: createStyle({ offset: [0, 1000], zIndex: 2 }),
  levelSelected: createStyle({ offset: [100, 1000], zIndex: 10 }),
  levelError: createStyle({ offset: [0, 1100], zIndex: 1 }),
  levelErrorSelected: createStyle({ offset: [100, 1100], zIndex: 10 }),
  rainfall: createStyle({ offset: [0, 1200], zIndex: 1 }),
  rainfallSelected: createStyle({ offset: [100, 1200], zIndex: 10 })
}

// WebGL styles uses Math.log2() polyfill for ie11
Math.log2 = (number) => {
  return Math.log(number) / Math.log(2)
}
