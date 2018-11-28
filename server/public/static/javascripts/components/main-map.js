// This file represents the main map used in various pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

(function (window, flood) {
  var ol = window.ol
  var maps = flood.maps
  var MapContainer = maps.MapContainer

  function MainMap (containerId, place) {
    // ol.View
    var view = new ol.View({
      zoom: place ? 11 : 6,
      minZoom: 6,
      maxZoom: 14,
      extent: maps.extent,
      center: ol.proj.transform(place ? place.center : maps.center, 'EPSG:4326', 'EPSG:3857')
    })

    // ol.Layers
    var road = maps.layers.road()
    var satellite = maps.layers.satellite()
    var floodsSevere = maps.layers.floodsSevere()
    var floodsWarning = maps.layers.floodsWarning()
    var floodsAlert = maps.layers.floodsAlert()
    var floodsNotInForce = maps.layers.floodsNotInForce()
    var stations = maps.layers.stations()
    var floodCentroids = maps.layers.floodCentroids()
    var floodPolygon = maps.layers.floodPolygon()

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
              ${props.value ? `<strong class="govuk-font-weight-bold">${props.value}m</strong> latest recorded<br>` : ''}
              ${props.percentile_5 ? `<strong class="govuk-font-weight-bold">${props.percentile_5}m</strong> flooding possible<br>` : ''}
              ${props.is_ffoi && props.ffoi_max ? `<strong class="govuk-font-weight-bold">${props.ffoi_max}m</strong> forecast high` : ''}
            </p>
            `}
            <span class="ol-overlay__symbol ol-overlay__symbol--${symbol}"></span>
        `
        } else if (id.startsWith('flood_warning_alert')) {
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

    // MapContainer options
    var options = {
      minIconResolution: 200,
      buttonText: 'Map showing current risk',
      view: view,
      layers: [
        road,
        satellite,
        floodsNotInForce,
        floodsAlert,
        floodsWarning,
        floodsSevere,
        floodPolygon,
        stations,
        floodCentroids
      ],
      onFeatureClick: onFeatureClick
    }

    // Localised
    if (place) {
      options.layers.push(maps.layers.location(place.name, place.center))
    }

    // Create MapContainer
    var containerEl = document.getElementById(containerId)
    var container = new MapContainer(containerEl, options)
    var map = container.map

    // Handle key interactions
    var keyForm = container.keyElement.querySelector('form')

    function setFloodsVisibility (severity, visible) {
      // flood centroids
      floodCentroids.getSource().forEachFeature(function (feature) {
        if (severity.indexOf(feature.get('severity')) > -1) {
          feature.setStyle(visible ? null : new ol.style.Style({}))
        }
      })
      // flood polygons
      severity.forEach(function (severity) {
        switch (severity) {
          case 1:
            floodsSevere.setVisible(visible)
            break
          case 2:
            floodsWarning.setVisible(visible)
            break
          case 3:
            floodsAlert.setVisible(visible)
            break
          case 4:
            floodsNotInForce.setVisible(visible)
            break
          default:
        }
      })
    }

    function setFloodsOpacity (opacity) {
      floodsSevere.setOpacity(opacity)
      floodsWarning.setOpacity(opacity)
      floodsAlert.setOpacity(opacity)
      floodsNotInForce.setOpacity(opacity)
    }

    // Detects if pixel is over a wms image and returns the layer
    function getFloodLayer (pixel) {
      return map.forEachLayerAtPixel(pixel, function (layer) {
        return layer
      }, {
        layerFilter: function (layer) {
          var ref = layer.get('ref')
          return (ref && ref.indexOf('floods-') > -1)
        }
      })
    }

    // Sets the source of selected warning polygon
    function setFloodPolygonSource (source) {
      map.getLayers().forEach(function (layer) {
        if (layer.get('ref') === 'flood-polygon') {
          layer.setSource(source)
        }
      })
    }

    // TODO: this should be performed dynamically from the key selection, or once cookie is implemented
    map.once('rendercomplete', function (event) {
      setFloodsVisibility([4], false)
    })

    // Reactions based on pan/zoom change on map
    map.on('moveend', function (event) {
      // Update layer opacity setting for different map resolutions
      var resolution = map.getView().getResolution()
      var layerOpacity = 1
      if (resolution > 20) {
        layerOpacity = 1
      } else if (resolution > 10) {
        layerOpacity = 0.8
      } else if (resolution > 5) {
        layerOpacity = 0.6
      } else {
        layerOpacity = 0.4
      }

      setFloodsOpacity(layerOpacity)

      // Key icons
      if (resolution <= options.minIconResolution) {
        // Key polygons
        keyForm.querySelectorAll('[data-style]').forEach((symbol) => {
          symbol.style = symbol.getAttribute('data-style-offset')
        })
      } else {
        // Key icons
        keyForm.querySelectorAll('[data-style]').forEach((symbol) => {
          symbol.style = symbol.getAttribute('data-style')
        })
      }
    })

    // Close key or place locator if map is clicked
    map.on('click', function (e) {
      // Get mouse coordinates and check for feature if not the highlighted flood polygon
      var feature = map.forEachFeatureAtPixel(e.pixel, function (feature) {
        return feature
      }, {
        layerFilter: function (layer) {
          return layer.get('ref') !== 'flood-polygon'
        }
      })

      // A new feature has been selected
      if (feature) {
        // Clear out pre selected polygon
        setFloodPolygonSource()
      } else {
        var layer = getFloodLayer(e.pixel)
        if (layer) {
          var url = layer.getSource().getGetFeatureInfoUrl(e.coordinate, view.getResolution(), 'EPSG:3857', {
            INFO_FORMAT: 'application/json',
            FEATURE_COUNT: 1,
            propertyName: 'fwa_key,fwa_code,severity,severity_description,description,geom'
          })

          if (url) {
            flood.utils.xhr(url, function (err, json) {
              if (err) {
                console.error(err)
              }

              var feature = (new ol.format.GeoJSON()).readFeatures(json, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
              })[0]

              // Add polygon to selection layer
              setFloodPolygonSource(new ol.source.Vector({
                features: [feature],
                format: new ol.format.GeoJSON()
              }))

              maps.onFeatureClick(feature)
              container.showOverlay(feature)
            })
          }
        } else {
          setFloodPolygonSource()
        }
      }
    })

    // Show cursor when hovering over features
    map.on('pointermove', function (e) {
      var mouseCoordInMapPixels = [e.originalEvent.offsetX, e.originalEvent.offsetY]
      // Detect vector feature at mouse coords
      var hit = map.forEachFeatureAtPixel(mouseCoordInMapPixels, function (feature, layer) {
        return true
      })

      // Detect wms image at mouse coords
      if (!hit) {
        hit = getFloodLayer(mouseCoordInMapPixels)
      }

      if (hit) {
        map.getTarget().style.cursor = 'pointer'
      } else {
        map.getTarget().style.cursor = ''
      }
    })

    // Key form layer toggle
    keyForm.addEventListener('change', function (e) {
      const target = e.target
      const name = target.name

      switch (name) {
        case 'baseLayer': {
          if (target.value === 'mapView') {
            road.setVisible(true)
            satellite.setVisible(false)
          } else {
            road.setVisible(false)
            satellite.setVisible(true)
          }
          break
        }
        case 'riverLevels': {
          stations.setVisible(target.checked)
          break
        }
        case 'floodWarnings': {
          setFloodsVisibility([1, 2], target.checked)
          break
        }
        case 'floodAlerts': {
          setFloodsVisibility([3], target.checked)
          break
        }
        case 'floodExpired': {
          setFloodsVisibility([4], target.checked)
          break
        }
      }
    })

    // If we have a location, set the map extent
    if (place && place.bbox) {
      var searchExtent = ol.proj.transformExtent(place.bbox, 'EPSG:4326', 'EPSG:3857')

      container.map.getView().fit(searchExtent, {
        maxZoom: 16,
        size: container.map.getSize()
      })
    }

    this.map = map
    this.container = container
  }

  maps.createMainMap = function (containerId, place) {
    return new MainMap(containerId, place)
  }
})(window, window.flood)
