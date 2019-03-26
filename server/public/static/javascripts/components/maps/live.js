// This file represents the main map used in various pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

(function (window, flood) {
  var ol = window.ol
  var maps = flood.maps
  var addOrUpdateParameter = flood.utils.addOrUpdateParameter
  var getParameterByName = flood.utils.getParameterByName
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

    // Load tooltip
    async function ensureFeatureTooltipHtml (feature) {
      var id = feature.getId()
      let trimId = id.replace('stations.', '')
      var props = feature.getProperties()
      var html
      if (!props.html) {
        if (id.startsWith('stations')) {
          // Get upstream - downstream data
          const upDownData = async () => {
            const upDownUrl = '/stations-upstream-downstream/' + trimId + '/' + props.direction
            try {
              const response = await fetch(upDownUrl)
              const upDownJson = await response.json()
              return upDownJson
            } catch (err) {
              return { error: 'Unable to display latest upstream / downstream readings' }
            }
          }

          html = window.nunjucks.render('tooltip-station.html', {
            type: 'station',
            props: props,
            upDown: await upDownData(),
            stationId: id.substr(9)
          })
        } else if (id.startsWith('flood_warning_alert')) {
          html = window.nunjucks.render('tooltip.html', {
            type: 'warnings',
            props: props
          })
        } else if (id.startsWith('rain')) {
          // Get rainfall data for station
          const rainfallData = async () => {
            const rainfallUrl = '/rain-gauge-tooltip/' + props.stationReference + '/' + props.label + '/100'
            try {
              const response = await fetch(rainfallUrl)
              const rainfallJson = await response.json()
              return rainfallJson
            } catch (err) {
              return { error: 'Unable to display latest readings' }
            }
          }

          html = window.nunjucks.render('tooltip.html', {
            type: 'rain',
            props: props,
            // rainGaugeId: id.substring(id.lastIndexOf('.') + 1)
            rainfallValues: await rainfallData()
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

    // Set initial map centre and zoom from querystring
    if (getParameterByName('cz')) {
      var centreZoom = getParameterByName('cz').split(',')
      map.getView().setCenter([parseFloat(centreZoom[0]), parseFloat(centreZoom[1])])
      map.getView().setZoom(parseFloat(centreZoom[2]))
    }

    // Set initial layers views from querystring
    if (getParameterByName('l')) {
      var layers = getParameterByName('l').split(',')
      if (layers.includes('s')) {
        keyForm.querySelector('#stations').checked = true
      }
      if (layers.includes('r')) {
        keyForm.querySelector('#rain').checked = true
      }
    }

    // Update URL centre and zoom parameter
    function updateUrlCentreZoom () {
      var cz = map.getView().getCenter()[0] + ',' + map.getView().getCenter()[1] + ',' + map.getView().getZoom()
      var state = { 'cz': cz }
      var title = document.title
      var url = addOrUpdateParameter(window.location.pathname + window.location.search, 'cz', cz)
      window.history.replaceState(state, title, url)
    }

    // Update URL layers parameter
    function updateUrlLayers () {
      var s = keyForm.querySelector('#stations').checked ? 's' : ''
      var r = keyForm.querySelector('#rain').checked ? 'r' : ''
      var l = [s, r].filter(Boolean).join(',')
      var state = { 'l': l }
      var title = document.title
      var url = addOrUpdateParameter(window.location.pathname + window.location.search, 'l', l)
      window.history.replaceState(state, title, url)
    }

    // Update Key and Canvas depending on visible features in extent
    function updateKeyAndCanvas () {
      var canvas = containerEl.querySelector('canvas')
      var extent = map.getView().calculateExtent()
      // getFeature request
      var url = '/ows?service=wfs&' +
        'version=1.3.0&' +
        'request=GetFeature&' +
        'typeNames=flood:flood_warning_alert&' +
        'propertyName=fwa_code,severity,description&' +
        'bbox=' + extent.join() + ',urn:ogc:def:crs:EPSG:3857&' +
        'outputFormat=application/json'
      var xhr = new XMLHttpRequest()
      xhr.open('GET', url)
      var onError = function () {
        console.log('Error: getPropertyValue')
      }
      xhr.onerror = onError
      xhr.onload = function () {
        if (xhr.status === 200) {
          var floodsPolygons = JSON.parse(xhr.responseText)

          // Set booleans for flood polygons
          var showSevere = !!floodsPolygons.features.filter(x => x.properties.severity === 1).length
          var showWarning = !!floodsPolygons.features.filter(x => x.properties.severity === 2).length
          var showAlert = !!floodsPolygons.features.filter(x => x.properties.severity === 3).length

          // Set booleans for flood centroids
          floodCentroids.getSource().forEachFeatureInExtent(extent, function (feature) {
            if (feature.get('severity') === 1) {
              showSevere = true
            } else if (feature.get('severity') === 2) {
              showWarning = true
            } else if (feature.get('severity') === 3) {
              showAlert = true
            }
          })

          // Set booleans for stations and rain centroids
          var showStations = !!stations.getSource().getFeaturesInExtent(extent).length
          var showRain = !!rain.getSource().getFeaturesInExtent(extent).length

          // Update key ul or li
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

          // Get visible features in view port
          var featuresInViewPort = []
          var visibleSeverities = []
          forEach(keyForm.querySelectorAll('.govuk-checkboxes__input'), function (input) {
            if (input.checked) {
              if (input.hasAttribute('data-severity')) {
                visibleSeverities.push(parseInt(input.getAttribute('data-severity')))
              } else if (input.getAttribute('data-layer') === 'stations') {
                stations.getSource().forEachFeatureInExtent(extent, function (feature) {
                  featuresInViewPort.push({
                    'id': feature.getId(),
                    'description': feature.get('name'),
                    'layer': 'stations'
                  })
                })
              } else if (input.getAttribute('data-layer') === 'rain') {
                rain.getSource().forEachFeatureInExtent(extent, function (feature) {
                  featuresInViewPort.push({
                    'id': feature.getId(),
                    'description': feature.get('label'),
                    'layer': 'rain'
                  })
                })
              }
            }
          })
          if (map.getView().getResolution() <= options.minIconResolution) {
            floodsPolygons.features.forEach(function (feature) {
              if (visibleSeverities.indexOf(feature.properties.severity) > -1) {
                var layer = ''
                switch (feature.properties.severity) {
                  case 1:
                    layer = 'floodsSevere'
                    break
                  case 2:
                    layer = 'floodsWarning'
                    break
                  case 3:
                    layer = 'floodsAlert'
                    break
                }
                featuresInViewPort.push({
                  'id': feature.id,
                  'description': feature.properties.description,
                  'layer': layer
                })
              }
            })
          } else {
            floodCentroids.getSource().forEachFeatureInExtent(extent, function (feature) {
              if (visibleSeverities.indexOf(parseInt(feature.get('severity'))) > -1) {
                featuresInViewPort.push({
                  'id': feature.getId(),
                  'description': feature.get('description'),
                  'layer': 'floodCentroids'
                })
              }
            })
          }
          // Add to canvas
          if (featuresInViewPort.length <= 20) {
            canvas.innerHTML = '<a href="/test1">Test link</a>,<a href="/test2">Test link 2</a>'
          }
          canvas.innerHTML = window.nunjucks.render('canvas-live.html', {
            features: featuresInViewPort.length <= 20 ? featuresInViewPort : [],
            numFeatures: featuresInViewPort.length
          })
        } else {
          onError()
        }
      }
      xhr.send()
    }

    // Set flood layers visibility
    function setFloodsVisibility (severity, visible) {
      // flood centroids
      floodCentroids.getSource().forEachFeature(function (feature) {
        if (feature.get('severity') === severity) {
          feature.setStyle(visible ? null : new ol.style.Style({}))
        }
      })
      // flood polygons and inViewport flags
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

    // Pan map
    function panMap (feature) {
      var bounds = map.getView().calculateExtent(map.getSize())
      bounds = ol.extent.buffer(bounds, -1000)
      if (!ol.extent.containsExtent(bounds, feature.getGeometry().getExtent())) {
        map.getView().setCenter(feature.getGeometry().getCoordinates())
      }
    }

    //
    // Events
    //

    // TODO: this should be performed dynamically from the key selection, or once cookie is implemented
    map.once('rendercomplete', function (e) {
      // Set floods visibility
      setFloodsVisibility(4, false)
      // Set point layer visibility based on key checked state
      forEach(keyForm.querySelectorAll('.govuk-checkboxes__input'), function (input) {
        switch (input.getAttribute('data-layer')) {
          case 'stations': {
            input.checked ? stations.setStyle(maps.styles.stations) : stations.setStyle(new ol.style.Style({}))
            break
          }
          case 'rain': {
            input.checked ? rain.setStyle(maps.styles.rain) : rain.setStyle(new ol.style.Style({}))
            break
          }
        }
      })
      // Toggle key section if features are in viewport
      updateKeyAndCanvas()
    })

    // Reactions based on pan/zoom change on map
    map.addEventListener('moveend', function (e) {
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

      updateUrlCentreZoom()
      updateKeyAndCanvas()
    })

    // Close key or place locator if map is clicked
    map.addEventListener('click', async function (e) {
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
        // Change active element if exists
        document.querySelectorAll('.map-feature-list button').forEach(function (button) {
          if (button.getAttribute('data-id') === feature.getId()) {
            button.focus()
          }
        })
        // Add point to selection layer
        setSelectedPointFeatureSource(new ol.source.Vector({
          features: [feature],
          format: new ol.format.GeoJSON()
        }))
        await ensureFeatureTooltipHtml(feature)
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
            flood.utils.xhr(url, async function (err, json) {
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
              await ensureFeatureTooltipHtml(feature)
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
    map.addEventListener('pointermove', function (e) {
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
        case 'severeFloodWarnings': {
          setFloodsVisibility(1, target.checked)
          break
        }
        case 'floodWarnings': {
          setFloodsVisibility(2, target.checked)
          break
        }
        case 'floodAlerts': {
          setFloodsVisibility(3, target.checked)
          break
        }
        case 'floodExpired': {
          setFloodsVisibility(4, target.checked)
          break
        }
        case 'stations': {
          target.checked ? stations.setStyle(maps.styles.stations) : stations.setStyle(new ol.style.Style({}))
          break
        }
        case 'rain': {
          target.checked ? rain.setStyle(maps.styles.rain) : rain.setStyle(new ol.style.Style({}))
          break
        }
      }
      updateUrlLayers()
      updateKeyAndCanvas()
    })

    // Overlay river level navigation button click
    document.querySelector('.ol-overlaycontainer-stopevent').addEventListener('click', async function (e) {
      if (e.target.classList.contains('overlay__navigation-button')) {
        var nextStationId = e.target.getAttribute('data-id')
        var feature = stations.getSource().getFeatureById(nextStationId)
        container.selectedFeature.set('isSelected', false)
        setSelectedPointFeatureSource()
        feature.set('isSelected', true)
        container.selectedFeature = feature
        panMap(feature)
        await ensureFeatureTooltipHtml(feature)
        container.showOverlay(feature)
      }
    })

    // Keyboard access to features
    document.addEventListener('keyup', e => {
      if (e.keyCode === 9) {
        // Clear existing selected feature
        if (container.selectedFeature) {
          container.selectedFeature.set('isSelected', false)
          container.selectedFeature = null
        }
        // Set selected feature
        if (e.target.closest('.map-feature-list')) {
          var layer = e.target.getAttribute('data-layer')
          var featureId = e.target.getAttribute('data-id')
          var feature = eval(layer).getSource().getFeatureById(featureId)
          feature.set('isSelected', true)
          container.selectedFeature = feature
          setSelectedPointFeatureSource(new ol.source.Vector({
            features: [feature],
            format: new ol.format.GeoJSON()
          }))
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
