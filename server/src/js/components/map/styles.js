'use strict'
/*
Sets up the window.flood.maps styles objects
*/
import { Style, Icon, Fill, Stroke, Text, Circle } from 'ol/style'

window.flood.maps.styles = {

  //
  // Vector styles live
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
        fillColour = targetAreaPolygonPattern('severe')
        zIndex = 11
        break
      case 2: // Warning
        strokeColour = '#D4351C'
        fillColour = targetAreaPolygonPattern('warning')
        zIndex = 10
        break
      case 1: // Alert
        strokeColour = '#F47738'
        fillColour = targetAreaPolygonPattern('alert')
        zIndex = isGroundwater ? 4 : 7
        break
      default: // Removed or inactive
        strokeColour = '#626A6E'
        fillColour = targetAreaPolygonPattern('removed')
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

  //
  // Vector styles outlook
  //

  outlookPolygons: (feature) => {
    if (!feature.get('isVisible')) {
      return
    }
    const zIndex = feature.get('z-index')
    const lineDash = [2, 3]
    let strokeColour = '#85994b'
    let fillColour = outlookPolygonPattern('veryLow')
    if (feature.get('risk-level') === 2) {
      strokeColour = '#ffdd00'
      fillColour = outlookPolygonPattern('low')
    } else if (feature.get('risk-level') === 3) {
      strokeColour = '#F47738'
      fillColour = outlookPolygonPattern('medium')
    } else if (feature.get('risk-level') === 4) {
      strokeColour = '#D4351C'
      fillColour = outlookPolygonPattern('high')
    }
    return new Style({
      stroke: new Stroke({ color: strokeColour, width: 1 }),
      fill: new Fill({ color: fillColour }),
      lineDash: lineDash,
      zIndex: zIndex
    })
  },

  places: (feature, resolution) => {
    const display = (() => {
      if (resolution > 1600) {
        return 1
      } else if (resolution > 800) {
        return 2
      } else if (resolution > 400) {
        return 3
      } else {
        return 4
      }
    })()

    if (parseInt(feature.get('d')) > display) {
      return
    }
    return [
      new Style({
        text: new Text({
          text: feature.get('n'),
          font: 'bold 14px GDS Transport, Arial, sans-serif',
          offsetY: -12,
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      }),
      new Style({
        text: new Text({
          text: feature.get('n'),
          font: 'bold 14px GDS Transport, Arial, sans-serif',
          offsetY: -12
        }),
        image: new Circle({
          fill: new Fill({
            color: '#0b0c0c'
          }),
          stroke: new Stroke({
            width: 0
          }),
          radius: 2
        })
      })
    ]
  }
}

//
// SVG fill paterns
//

const targetAreaPolygonPattern = (style) => {
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

const outlookPolygonPattern = (style) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = 8 * dpr
  canvas.height = 8 * dpr
  ctx.scale(dpr, dpr)
  switch (style) {
    case 'high':
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
    case 'medium':
      ctx.fillStyle = '#F47738'
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
    case 'low':
      ctx.fillStyle = '#ffdd00'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
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
    case 'veryLow':
      ctx.fillStyle = '#85994b'
      ctx.fillRect(0, 0, 8, 8)
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
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
  levelHigh: createStyle({ offset: [0, 900], zIndex: 3 }),
  levelHighSelected: createStyle({ offset: [100, 900], zIndex: 10 }),
  level: createStyle({ offset: [0, 1000], zIndex: 2 }),
  levelSelected: createStyle({ offset: [100, 1000], zIndex: 10 }),
  levelError: createStyle({ offset: [0, 1100], zIndex: 1 }),
  levelErrorSelected: createStyle({ offset: [100, 1100], zIndex: 10 })
}
