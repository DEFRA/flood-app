// This file represents the main map used in various pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

(function (window, flood) {
  var ol = window.ol
  var maps = flood.maps
  var forEach = flood.utils.forEach
  var MapContainer = maps.MapContainer

  function LiveMap (elementId, place, keyTemplate) {
    // ol.View
    var view = new ol.View({
      zoom: place ? 11 : 6,
      minZoom: 6,
      maxZoom: 14,
      extent: maps.extent,
      center: ol.proj.transform(place
        ? place.center
        : maps.center, 'EPSG:4326', 'EPSG:3857')
    })

    // ol.Layers
    var road = maps.layers.road()
    var satellite = maps.layers.satellite()
    var floodsSevere = maps.layers.floodsSevere()
    var floodsWarning = maps.layers.floodsWarning()
    var floodsAlert = maps.layers.floodsAlert()
    var floodsNotInForce = maps.layers.floodsNotInForce()
    var floodPolygon = maps.layers.floodPolygon()
    var stations = maps.layers.stations()
    var rain = maps.layers.rain()
    var floodCentroids = maps.layers.floodCentroids()
    var selectedPointFeature = maps.layers.selectedPointFeature()

    function ensureFeatureTooltipHtml (feature) {
      var id = feature.getId()
      var props = feature.getProperties()
      var template = 'tooltip.html'
      var html

      if (!props.html) {
        if (id.startsWith('stations')) {
          html = window.nunjucks.render(template, {
            type: 'station',
            props: props,
            stationId: id.substr(9)
          })
        } else if (id.startsWith('flood_warning_alert')) {
          html = window.nunjucks.render(template, {
            type: 'warnings',
            props: props
          })
        } else if (id.startsWith('rain')) {
          html = window.nunjucks.render(template, {
            type: 'rain',
            props: props
          })
        }
        feature.set('html', html)
      }
    }

    // MapContainer options
    var options = {
      minIconResolution: 200,
      buttonText: 'View map of current situation',
      view: view,
      keyTemplate: keyTemplate,
      keyProps: {},
      layers: [
        road,
        satellite,
        // floodsNotInForce,
        floodsAlert,
        floodsWarning,
        floodsSevere,
        floodPolygon,
        stations,
        rain,
        floodCentroids
      ]
    }

    // Localised
    if (place) {
      options.layers.push(maps.layers.location(place.name, place.center))
    }

    // Selected point feature last in zIndex
    options.layers.push(selectedPointFeature)

    // Create MapContainer
    var containerEl = document.getElementById(elementId)
    var container = new MapContainer(containerEl, options)
    var map = container.map

    // Handle key interactions
    var keyForm = container.keyElement.querySelector('form')

    // Toggle key sections depending on what features are visible in the current extent
    function toggleKeySections() {
      var extent = map.getView().calculateExtent()
      // getFeature request
      var url = '/ows?service=wfs&' +
        'version=1.3.0&'+
        'request=GetFeature&' +
        'typeNames=flood:flood_warning_alert&' +
        'propertyName=severity&' +
        'bbox='+extent.join()+',urn:ogc:def:crs:EPSG:3857&' +
        'outputFormat=application/json'
      var xhr = new XMLHttpRequest()
      xhr.open('GET', url)
      var onError = function() {
        console.log('Error: getPropertyValue')
      }
      xhr.onerror = onError
      xhr.onload = function() {
        if (xhr.status == 200) {
          var floodsPolygons = JSON.parse(xhr.responseText)
          var showSevere = false
          var showWarning = false
          var showAlert = false
          var showNotInForce = false
          var showStations = false
          var showRain = false
          // Set booleans for flood polygons
          showSevere = floodsPolygons.features.filter(x => x.properties.severity === 1).length ? true : false
          showWarning = floodsPolygons.features.filter(x => x.properties.severity === 2).length ? true : false
          showAlert = floodsPolygons.features.filter(x => x.properties.severity === 3).length ? true : false
          showNotInForce = floodsPolygons.features.filter(x => x.properties.severity === 4).length ? true : false
          // Set booleans for flood centroids
          floodCentroids.getSource().forEachFeatureInExtent(extent, function(feature) {
            switch (feature.get('severity')) {
              case 1: { showSevere = true }
              case 2: { showWarning = true }
              case 3: { showAlert = true }
              case 4: { showNotInForce = true }
            }
          })
          // Set booleans for stations centroids
          showStations = stations.getSource().getFeaturesInExtent(extent).length ? true : false
          // Set booleans for rain gauge centroids
          showRain = rain.getSource().getFeaturesInExtent(extent).length ? true : false
          // Toggle key ul or li display
          if (showSevere || showWarning || showAlert) {
            keyForm.querySelector('#severeFloodWarnings').closest('ul').style.display = 'block'
            keyForm.querySelector('#severeFloodWarnings').closest('li').style.display = showSevere ? 'block' : 'none'
            keyForm.querySelector('#floodWarnings').closest('li').style.display = showWarning ? 'block' : 'none'
            keyForm.querySelector('#floodAlerts').closest('li').style.display = showAlert ? 'block' : 'none'
          } else {
            keyForm.querySelector('#severeFloodWarnings').closest('ul').style.display = 'none'
          }
          keyForm.querySelector('#stations').closest('ul').style.display = showStations ? 'block' : 'none'
          keyForm.querySelector('#rain').closest('ul').style.display = showRain ? 'block' : 'none'
        } else {
          onError()
        }
      }
      xhr.send()
    }

    // Set point layer visibility based on key checked state
    forEach(keyForm.querySelectorAll('.govuk-checkboxes__input'), function (input) {
      switch (input.getAttribute('data-layer')) {
        case 'stations': {
          stations.setVisible(input.checked)
          break
        }
        case 'rain': {
          rain.setVisible(input.checked)
          break
        }
      }
    })

    // Set flood layers visibility
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
      floodPolygon.setSource(source)
    }

    // Sets the source of selected point feature
    function setSelectedPointFeatureSource (source) {
      selectedPointFeature.setSource(source)
      // Set feature style
      if (source) {
        // *** Need a schema for all GeoJson features
        var id = source.getFeatures()[0].getId()
        if (id.startsWith('stations')) {
          selectedPointFeature.setStyle(maps.styles.stations)
        } else if (id.startsWith('flood_warning_alert')) {
          selectedPointFeature.setStyle(maps.styles.floods)
        } else if (id.startsWith('rain')) {
          selectedPointFeature.setStyle(maps.styles.rain)
        } else {
          selectedPointFeature.setStyle(maps.styles.location)
        }
      }
    }

    //
    // Events
    //

    // TODO: this should be performed dynamically from the key selection, or once cookie is implemented
    map.once('rendercomplete', function (event) {
      setFloodsVisibility([4], false)
      // Toggle key section if features are in viewport
      toggleKeySections()
    })

    // Toggle key section when flood centroids have loaded
    floodCentroids.getSource().on('change', function (event) {
      toggleKeySections()
    })

    // Toggle key section when flood centroids have loaded
    stations.getSource().on('change', function (event) {
      toggleKeySections()
    })

    // Toggle key section when flood centroids have loaded
    rain.getSource().on('change', function (event) {
      toggleKeySections()
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
        forEach(keyForm.querySelectorAll('[data-style]'), function (symbol) {
          symbol.style = symbol.getAttribute('data-style-offset')
        })
      } else {
        // Key icons
        forEach(keyForm.querySelectorAll('[data-style]'), function (symbol) {
          symbol.style = symbol.getAttribute('data-style')
        })
      }

      // Toggle key section if features are in viewport
      toggleKeySections()
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
        // Notifies the container that something was hit
        // *** Point feature
        e.hit = true
        // Add point to selection layer
        setSelectedPointFeatureSource(new ol.source.Vector({
          features: [feature],
          format: new ol.format.GeoJSON()
        }))
        ensureFeatureTooltipHtml(feature)
        container.showOverlay(feature)
      } else {
        var layer = getFloodLayer(e.pixel)
        if (layer) {
          // Notifies the container that something was hit
          // *** Flood polygon feature
          e.hit = true
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

              ensureFeatureTooltipHtml(feature)
              container.showOverlay(feature)
            })
          }
        } else {
          // Clear out pre selected polygon
          setFloodPolygonSource()
          // Clear out pre selected point
          setSelectedPointFeatureSource()
        }
      }
    })

    // Show cursor when hovering over features
    map.on('pointermove', function (e) {
      // Detect vector feature at mouse coords
      var hit = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        return true
      })

      // Detect wms image at mouse coords
      if (!hit) {
        hit = getFloodLayer(e.pixel)
      }

      if (hit) {
        map.getTarget().style.cursor = 'pointer'
      } else {
        map.getTarget().style.cursor = ''
      }
    })

    // Key form layer toggle
    keyForm.addEventListener('change', function (e) {
      var target = e.target
      var name = target.name

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
        case 'stations': {
          stations.setVisible(target.checked)
          break
        }
        case 'rain': {
          rain.setVisible(target.checked)
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

  // Export a helper factory to create this map
  // onto the `maps` object.
  // (This is done mainly to avoid the rule
  // "do not use 'new' for side effects. (no-new)")
  maps.createLiveLocationMap = function (containerId, place) {
    return new LiveMap(containerId, place, 'key-live-location.html')
  }
  maps.createLiveNationalMap = function (containerId, place) {
    return new LiveMap(containerId, place, 'key-live-national.html')
  }
})(window, window.flood)
