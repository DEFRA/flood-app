(function (window, maps) {
  var ol = window.ol
  var styles = {}

  var pattern = function (severity, isSelected) {
    // var pixelRatio = window.devicePixelRatio
    var canvas = document.createElement('canvas')
    var context = canvas.getContext('2d')
    if (severity === 1) {
      canvas.width = 10
      canvas.height = 10
      isSelected ? context.fillStyle = '#B6000C' : context.fillStyle = '#E3000F'
      context.fillRect(0, 0, 10, 10)
      context.beginPath()
      context.lineCap = 'square'
      isSelected ? context.strokeStyle = '#C1666C' : context.strokeStyle = '#F17F87'
      context.lineWidth = 1
      context.moveTo(0, 0)
      context.lineTo(10, 10)
      context.stroke()
      context.moveTo(0, 10)
      context.lineTo(10, 0)
      context.stroke()
    } else if (severity === 2) {
      canvas.width = 7
      canvas.height = 7
      isSelected ? context.fillStyle = '#C1666C' : context.fillStyle = '#F17F87'
      context.fillRect(0, 0, 7, 7)
      context.beginPath()
      context.lineCap = 'square'
      isSelected ? context.strokeStyle = '#B6000C' : context.strokeStyle = '#E3000F'
      context.lineWidth = 6
      context.moveTo(3, 0)
      context.lineTo(3, 10)
      context.stroke()
    } else if (severity === 3) {
      canvas.width = 10
      canvas.height = 10
      isSelected ? context.fillStyle = '#DEAF72' : context.fillStyle = '#F8C37F'
      context.fillRect(0, 0, 10, 10)
      context.beginPath()
      context.lineCap = 'square'
      isSelected ? context.strokeStyle = '#D87900' : context.strokeStyle = '#F18700'
      context.lineWidth = 6
      context.moveTo(0, 5)
      context.lineTo(5, 0)
      context.stroke()
      context.moveTo(5, 10)
      context.lineTo(10, 5)
      context.stroke()
    } else if (severity === 4) {
      canvas.width = 7
      canvas.height = 7
      isSelected ? context.fillStyle = '#929597' : context.fillStyle = '#B7BBBD'
      context.fillRect(0, 0, 7, 7)
      context.beginPath()
      context.lineCap = 'square'
      isSelected ? context.strokeStyle = '#595F62' : context.strokeStyle = '#6F777B'
      context.lineWidth = 6
      context.moveTo(0, 3)
      context.lineTo(10, 3)
      context.stroke()
    }
    context.restore()
    return context.createPattern(canvas, 'repeat')
  }

  function floods (feature, resolution) {
    if (!feature.get('isVisible')) {
      return
    }
    // Defaults
    var strokeColour, fillColour, zIndex
    var source = '/assets/images/icon-map-features-2x.png' // Icon sprite image source
    var offset = [0, 0] // Icon sprite offset
    var image
    var isSelected = feature.get('isSelected')

    if (feature.get('severity') === 1) {
      strokeColour = isSelected ? '#b6000c' : '#e3000f'
      fillColour = pattern(1, isSelected)
      zIndex = 5
      offset = [0, 900]
    } else if (feature.get('severity') === 2) {
      strokeColour = isSelected ? '#b6000c' : '#e3000f'
      fillColour = pattern(2, isSelected)
      zIndex = 4
      offset = [0, 1000]
    } else if (feature.get('severity') === 3) {
      strokeColour = isSelected ? '#d87900' : '#f18700'
      fillColour = pattern(3, isSelected)
      zIndex = 3
      offset = [0, 1100]
    } else if (feature.get('severity') === 4) {
      strokeColour = isSelected ? '#595f62' : '#6f777b'
      fillColour = pattern(4, isSelected)
      zIndex = 2
      offset = [0, 1200]
    }

    // Remove fills from points
    if (resolution > 200) {
      strokeColour = 'transparent'
      fillColour = 'transparent'
      image = new ol.style.Icon({
        src: source,
        size: [86, 86],
        anchor: [0.5, 0.75],
        scale: 0.5,
        offset: offset
      })
    }

    // Selected feature
    if (feature.get('isSelected') && resolution > 200) {
      zIndex = 6
      offset[0] += 100
    }

    // Generate style
    var style = new ol.style.Style({
      image: image,
      fill: new ol.style.Fill({ color: fillColour }),
      stroke: new ol.style.Stroke({
        color: strokeColour,
        width: 1,
        miterLimit: 2,
        lineJoin: 'round',
        lineDash: [0, 0]
      }),
      opacity: 1,
      zIndex: zIndex
    })

    return style
  }

  function stations (feature, resolution) {
    var featureId = feature.getId()
    if (!featureId) {
      return
    }

    var props = feature.getProperties()
    var source = '/assets/images/icon-map-features-2x.png'
    var zIndex = 1
    var anchor = [0.5, 0.75]
    var offset

    switch (true) {
      case props.status === 'Suspended' || props.status === 'Closed':
        offset = [0, 0]
        zIndex = 1
        break
      case props.atrisk && props.type !== 'C' && props.type !== 'G':
        offset = [0, 300]
        zIndex = 3
        break
      case props.is_ffoi_at_risk:
        offset = [0, 200]
        zIndex = 4
        break
      default:
        offset = [0, 100]
        zIndex = 2
        break
    }

    if (resolution > 200) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    if (feature.get('isSelected')) {
      offset[0] += 100
      zIndex = 5
    }

    var style = new ol.style.Style({
      image: new ol.style.Icon({
        src: source,
        size: [66, 84],
        anchor: anchor,
        scale: 0.5,
        offset: offset
      }),
      zIndex: zIndex
    })

    return style
  }

  function rain (feature, resolution) {
    var featureId = feature.getId()
    if (!featureId) {
      return
    }

    var source = '/assets/images/icon-map-features-2x.png'
    var zIndex = 1
    var anchor = [0.5, 0.75]
    var offset = [0, 1500]

    if (resolution > 200) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    if (feature.get('isSelected')) {
      offset[0] += 100
      zIndex = 5
    }

    var style = new ol.style.Style({
      image: new ol.style.Icon({
        src: source,
        size: [66, 84],
        anchor: anchor,
        scale: 0.5,
        offset: offset
      }),
      zIndex: zIndex
    })

    return style
  }

  function impacts (feature, resolution) {
    var featureId = feature.getId()
    if (!featureId) {
      return
    }

    var source = '/assets/images/icon-map-features-2x.png'
    var zIndex = 1
    var anchor = [0.5, 0.75]
    var offset = [0, 500]

    if (resolution > 200) {
      offset[0] += 200
      anchor = [0.5, 0.5]
    }

    if (feature.get('isSelected')) {
      offset[0] += 100
      zIndex = 5
    }

    var style = new ol.style.Style({
      image: new ol.style.Icon({
        src: source,
        size: [74, 74],
        anchor: anchor,
        scale: 0.5,
        offset: offset
      }),
      zIndex: zIndex
    })

    return style
  }

  function location (feature, resolution) {
    var offset = [0, 1300] // Icon sprite offset

    // Feature is also slected
    if (feature.get('isSelected')) {
      offset[0] += 100
    }

    // Generate style
    var style = new ol.style.Style({
      image: new ol.style.Icon({
        src: '/assets/images/icon-map-features-2x.png',
        size: [66, 84],
        anchor: [0.5, 0.92],
        scale: 0.5,
        offset: offset
      })
    })

    return style
  }

  // styles.polygons = polygons
  styles.impacts = impacts
  styles.stations = stations
  styles.rain = rain
  styles.floods = floods
  styles.location = location

  maps.styles = styles
})(window, window.flood.maps)
