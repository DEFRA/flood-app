(function (window, flood) {
  var ol = window.ol

  var Maps = {}

  var lonLat = [
    -1.4758,
    52.9219
  ]

  var extent = ol.proj.transformExtent([
    -5.75447130203247,
    49.9302711486816,
    1.79968345165253,
    55.8409309387207
  ], 'EPSG:4326', 'EPSG:3857')

  var center = [
    -1.4758,
    52.9219
  ]

  function floodsCentroidStyle (feature, resolution) {
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
      zIndex = 2
      offset = [0, 1500]
      if (feature.get('isSelected') === true) {
        offset[0] += 100
      }
    } else if (feature.get('severity') === 4) {
      fillColour = '#6f777b'
      zIndex = 3
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

  function stationsStyle (feature, resolution) {
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

  function locationStyle (feature, resolution) {
    if (/* feature.get('isVisible') */true) {
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

      // Toggle display of icon/polygon features depending on resolution
      // if (resolution <= self.options.minIconResolution) {
      //   if (feature.get('geometryType') === 'point') {
      //     return null
      //   }
      // } else {
      //   if (feature.get('geometryType') === 'polygon') {
      //     return null
      //   }
      // }

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
    } else {
      return null
    }
  }

  function onFeatureClick (feature) {
    var id = feature.getId()
    var props = feature.getProperties()
    var html

    if (!props.html) {
      if (id.startsWith('stations')) {
        var stationId = id.substr(9)
        var symbol = 'normal'
        if (props.atrisk) {
          symbol = 'above'
        } else if (props.is_ffoi_at_risk) {
          symbol = 'forecastAbove'
        } else if (props.status === 'Closed' || props.status === 'Suspended') {
          symbol = 'disabled'
        }

        html = `
            <p class="govuk-!-margin-bottom-2">
              <span class="govuk-body-m govuk-!-font-weight-bold">${props.river}</span><br/>
              <a class="govuk-body-s" href="/station/${stationId}">${props.name}</a>
            </p>
            ${props.status === 'Closed' || props.status === 'Suspended' ? `
            <p class="govuk-body-s">Temporarily out of service</p>
            ` : `
            <p class="govuk-body-s">
              <strong class="govuk-font-weight-bold">${props.value}m</strong> latest recorded<br/>
              <strong class="govuk-font-weight-bold">${props.percentile_5}m</strong> flooding possible
              ${props.is_ffoi && props.ffoi_max && `<br><strong class="govuk-font-weight-bold">${props.ffoi_max}m</strong> forecast high`}
            </p>
            `}
            <span class="ol-overlay__symbol ol-overlay__symbol--${symbol}"></span>
        `
      } else if (id.startsWith('flood_warning_alert_centroid')) {
        html = `
          <p>
            <span class="govuk-body-m govuk-!-font-weight-bold">${props.severity_description}</span><br/>
            <a class="govuk-body-s" href="/target-area/${props.fwa_code}">${props.description}</a>
          </p>
          <span class="ol-overlay__symbol ol-overlay__symbol--${props.severity}"></span>`
      }
      feature.set('html', html)
    }
  }

  Maps.lonLat = lonLat
  Maps.extent = extent
  Maps.center = center
  Maps.stationsStyle = stationsStyle
  Maps.locationStyle = locationStyle
  Maps.floodsCentroidStyle = floodsCentroidStyle
  Maps.onFeatureClick = onFeatureClick

  flood.Maps = Maps
})(window, window.Flood)
