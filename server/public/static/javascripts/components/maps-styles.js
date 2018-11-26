(function (window, maps) {
  var ol = window.ol
  var styles = {}

  function floods (feature, resolution) {
    // Defaults
    var strokeColour = 'transparent'
    var fillColour = 'transparent'
    var strokeWidth = 3
    var zIndex = 1
    var source = '/assets/images/icon-map-features-2x.png' // Icon sprite image source
    var offset = [0, 0] // Icon sprite offset
    var image = null
    var text = null
    var opacity = 1
    var lineDash = [0, 0]

    strokeWidth = 3

    if (feature.get('severity') === 1) {
      strokeColour = '#e3000f'
      zIndex = 5
      offset = [0, 1300]
      if (feature.get('isSelected') === true) {
        zIndex = 6
        offset[0] += 100
      }
    } else if (feature.get('severity') === 2) {
      zIndex = 4
      offset = [0, 1400]
      if (feature.get('isSelected') === true) {
        zIndex = 6
        offset[0] += 100
      }
    } else if (feature.get('severity') === 3) {
      fillColour = '#f18700'
      zIndex = 3
      offset = [0, 1500]
      if (feature.get('isSelected') === true) {
        offset[0] += 100
      }
    } else if (feature.get('severity') === 4) {
      fillColour = '#6f777b'
      zIndex = 2
      offset = [0, 1700]
      if (feature.get('isSelected') === true) {
        zIndex = 6
        offset[0] += 100
      }
    }

    // Define icon
    image = new ol.style.Icon({
      src: source,
      size: [86, 86],
      anchor: [0.5, 0.75],
      scale: 0.5,
      offset: offset
    })

    // Generate style
    var style = new ol.style.Style({
      fill: new ol.style.Fill({ color: fillColour }),
      stroke: new ol.style.Stroke({
        color: strokeColour,
        width: strokeWidth,
        miterLimit: 2,
        lineJoin: 'round',
        lineDash: lineDash
      }),
      lineDash: lineDash,
      image: image,
      text: text,
      opacity: opacity,
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
    var offset

    if (resolution <= 200) {
      switch (true) {
        case props.status === 'Suspended' || props.status === 'Closed':
          offset = [0, 0]
          break
        case props.atrisk && props.type !== 'C' && props.type !== 'G':
          offset = [0, 300]
          break
        case props.is_ffoi_at_risk:
          offset = [0, 200]
          break
        default:
          offset = [0, 100]
          break
      }

      if (feature.get('isSelected') === true) {
        offset[0] += 100
      }

      return [
        new ol.style.Style({
          image: new ol.style.Icon({
            src: source,
            size: [86, 86],
            anchor: [0.5, 0.75],
            scale: 0.5,
            offset: offset
          })
        })
      ]
    } else if (resolution > 200) {
      switch (true) {
        case props.status === 'Suspended' || props.status === 'Closed':
          return [
            new ol.style.Style({
              image: new ol.style.Circle({
                fill: new ol.style.Fill({
                  color: '#6e777b'
                }),
                radius: 5,
                stroke: new ol.style.Stroke({
                  color: '#fff'
                })
              })
            })
          ]
        case props.atrisk && props.type !== 'C' && props.type !== 'G':
          return [
            new ol.style.Style({
              image: new ol.style.Circle({
                fill: new ol.style.Fill({
                  color: '#b10d1e'
                }),
                radius: 5,
                stroke: new ol.style.Stroke({
                  color: '#fff'
                })
              })
            })
          ]
        default:
          return [
            new ol.style.Style({
              image: new ol.style.Circle({
                fill: new ol.style.Fill({
                  color: '#006436'
                }),
                radius: 5,
                stroke: new ol.style.Stroke({
                  color: '#fff'
                })
              })
            })
          ]
      }
    }
  }

  function location (feature, resolution) {
    // Defaults
    var strokeColour = 'transparent'
    var fillColour = 'transparent'
    var strokeWidth = 3
    var zIndex = 1
    var source = '/assets/images/icon-map-features-2x.png' // Icon sprite image source
    var offset = [0, 0] // Icon sprite offset
    var image = null
    var text = null
    var opacity = 1
    var lineDash = [0, 0]

    strokeWidth = 3

    offset = [0, 1800]

    // Feature is also slected
    if (feature.get('isSelected') == true) {
      offset[0] += 100
    }

    // Define icon
    image = new ol.style.Icon({
      src: source,
      size: [66, 84],
      anchor: [0.5, 0.92],
      scale: 0.5,
      offset: offset
    })

    // Generate style
    var style = new ol.style.Style({
      fill: new ol.style.Fill({ color: fillColour }),
      stroke: new ol.style.Stroke({
        color: strokeColour,
        width: strokeWidth,
        miterLimit: 2,
        lineJoin: 'round',
        lineDash: lineDash
      }),
      lineDash: lineDash,
      image: image,
      text: text,
      opacity: opacity,
      zIndex: zIndex
    })

    return style
  }

  // Style to highlight selected polygon
  function floodPolygon () {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'RGB(0, 0, 0, 0.2)'
      })
    })
  }

  styles.floods = floods
  styles.stations = stations
  styles.location = location
  styles.floodPolygon = floodPolygon

  maps.styles = styles
})(window, window.flood.maps)
