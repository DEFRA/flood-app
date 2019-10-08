// This file represents the main map used in various pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

(function (window, flood) {
  const ol = window.ol
  const maps = flood.maps
  const addOrUpdateParameter = flood.utils.addOrUpdateParameter
  const getParameterByName = flood.utils.getParameterByName
  const forEach = flood.utils.forEach
  const MapContainer = maps.MapContainer

  function LiveMap (queryStringParameters) {
    // Container element
    var elementId = 'map-live'
    var containerEl = document.getElementById(elementId)

    var center = ol.proj.transform(maps.center, 'EPSG:4326', 'EPSG:3857')

    // ol.View
    var view = new ol.View({
      zoom: 6,
      minZoom: 6,
      maxZoom: 18,
      center: center
    })

    // ol.Layers
    var road = maps.layers.road()
    var satellite = maps.layers.satellite()
    var polygons = maps.layers.polygons()
    var floodCentroids = maps.layers.floodCentroids()
    var stations = maps.layers.stations()
    var rain = maps.layers.rain()
    var impacts = maps.layers.impacts()
    var selectedPointFeature = maps.layers.selectedPointFeature()

    // Format date
    function toolTipDate (dateTime) {
      var hours = dateTime.getHours() > 12 ? dateTime.getHours() - 12 : dateTime.getHours()
      var minutes = (dateTime.getMinutes() < 10 ? '0' : '') + dateTime.getMinutes()
      var amPm = (dateTime.getHours() > 12) ? 'pm' : 'am'
      var day = dateTime.getDate()
      var month = parseInt(dateTime.getMonth()) + 1
      var year = dateTime.getFullYear().toString().substr(-2)
      const isToday = (dateTime) => {
        const today = new Date()
        return dateTime.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)
      }
      const isTomorrow = (dateTime) => {
        const tomorrow = new Date() + 1
        return dateTime.setHours(0, 0, 0, 0) === tomorrow.setHours(0, 0, 0, 0)
      }
      const isYesterday = (dateTime) => {
        const yesterday = new Date() - 1
        return dateTime.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0)
      }
      var date = hours + ':' + minutes + amPm
      if (isToday) {
        date += ' today'
      } else if (isTomorrow) {
        date += ' tomorrow'
      } else if (isYesterday) {
        date += ' yesterday'
      } else {
        date += ' on ' + day + '/' + month + '/' + year
      }
      return date
    }

    // Load tooltip
    async function ensureFeatureTooltipHtml (feature) {
      var id = feature.getId()
      let trimId = id.replace('stations.', '')
      var props = feature.getProperties()
      if (props.value_date) {
        props.value_date = toolTipDate(new Date(props.value_date))
      }
      if (props.ffoi_date) {
        props.ffoi_date = toolTipDate(new Date(props.value_date))
      }
      var html
      if (!props.html) {
        if (id.startsWith('impacts')) {
          html = window.nunjucks.render('tooltip.html', {
            type: 'impact',
            props: props
          })
        } else if (id.startsWith('stations')) {
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
    var mapOptions = {
      minIconResolution: 200,
      view: view,
      keyTemplate: 'map-key-live.html',
      layers: [
        road,
        satellite,
        polygons,
        rain,
        stations,
        impacts,
        floodCentroids
      ],
      queryStringParameters: queryStringParameters
    }
    // Selected point feature last in zIndex
    mapOptions.layers.push(selectedPointFeature)

    // Create MapContainer
    var container = new MapContainer(containerEl, mapOptions)
    var map = container.map

    // Handle key interactions
    var keyForm = container.keyElement.querySelector('form')

    // Update Key and Canvas depending on visible features in extent
    function updateKeyAndCanvas () {
      var extent = map.getView().calculateExtent()
      var showSevere = showWarning = showAlert = false

      // Set booleans for flood centroids
      polygons.getSource().forEachFeatureInExtent(extent, function (feature) {
        if (feature.get('severity') === 1) {
          showSevere = true
        } else if (feature.get('severity') === 2) {
          showWarning = true
        } else if (feature.get('severity') === 3) {
          showAlert = true
        }
      })

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
      var showImpacts = !!impacts.getSource().getFeaturesInExtent(extent).length
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
      keyForm.querySelector('#impacts').closest('ul').style.display = showImpacts ? 'block' : 'none'
      keyForm.querySelector('#stations').closest('ul').style.display = showStations ? 'block' : 'none'
      keyForm.querySelector('#rain').closest('ul').style.display = showRain ? 'block' : 'none'

      // Get visible features in view port
      /*
      var featuresInViewPort = []
      var visibleSeverities = []
      forEach(keyForm.querySelectorAll('.govuk-checkboxes__input'), function (input) {
        if (input.checked) {
          if (input.hasAttribute('data-severity')) {
            visibleSeverities.push(parseInt(input.getAttribute('data-severity')))
          } else if (input.getAttribute('data-layer') === 'impacts') {
            impacts.getSource().forEachFeatureInExtent(extent, function (feature) {
              featuresInViewPort.push({
                'id': feature.getId(),
                'description': feature.get('label'),
                'layer': 'impacts'
              })
            })
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
      const canvas = containerEl.querySelector('canvas')
      if (featuresInViewPort.length <= 20) {
        canvas.innerHTML = '<a href="/test1">Test link</a>,<a href="/test2">Test link 2</a>'
      }
      canvas.innerHTML = window.nunjucks.render('canvas-live.html', {
        features: featuresInViewPort.length <= 20 ? featuresInViewPort : [],
        numFeatures: featuresInViewPort.length
      })
      */
    }

    // Set flood layers visibility
    /*
    function setFloodsVisibility (severity, visible) {
      if (visible) { // Temp fix to stop centroids initially showing if layer is off
        floodCentroids.setVisible(true)
      }
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
    */

    /*
    function setFloodsOpacity (opacity) {
      floodsSevere.setOpacity(opacity)
      floodsWarning.setOpacity(opacity)
      floodsAlert.setOpacity(opacity)
      floodsNotInForce.setOpacity(opacity)
    }
    */

    // Detects if pixel is over a wms image and returns the layer
    /*
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
    */

    // Sets the source of selected warning polygon
    /*
    function setFloodPolygonSource (source) {
      floodPolygon.setSource(source)
    }
    */

    // Sets the source of selected point feature
    function setSelectedPointFeatureSource (source) {
      selectedPointFeature.setSource(source)
      // Set feature style
      if (source) {
        // *** Need a schema for all GeoJson features
        var id = source.getFeatures()[0].getId()
        if (id.startsWith('impacts')) {
          selectedPointFeature.setStyle(maps.styles.impacts)
        } else if (id.startsWith('stations')) {
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

    // Layer visibility
    function setFeatureSetVisibility() {
      forEach(keyForm.querySelectorAll('.map-key__features input'), function (input) {
        // Set layer visiblity or feature style
        if (input.id === 'mapView') {
          if (input.checked) {
            road.setVisible(true)
            satellite.setVisible(false)
          } else {
            road.setVisible(false)
            satellite.setVisible(true)
          }
        } else if (input.id === 'stations') {
          if (input.checked) {
            stations.setStyle(maps.styles.stations)
          } else {
            stations.setStyle(new ol.style.Style({}))
          }
          // stations.setVisible(true)
        } else if (input.id === 'impacts') {
          if (input.checked) {
            impacts.setStyle(maps.styles.impacts)
          } else {
            impacts.setStyle(new ol.style.Style({}))
          }
          // impacts.setVisible(true)
        } else if (input.id === 'rain') {
          if (input.checked) {
            rain.setStyle(maps.styles.rain)
          } else {
            rain.setStyle(new ol.style.Style({}))
          }
          // rain.setVisible(true)
        }
      })
    }
        /*
        if (target.name === 'baselayer') {
          if (target.value === 'mapView') {
            road.setVisible(true)
            satellite.setVisible(false)
          } else {
            road.setVisible(false)
            satellite.setVisible(true)
          }
        } else if (target.name === 'stations') {
          target.checked ? stations.setStyle(maps.styles.stations) : stations.setStyle(new ol.style.Style({}))
        } else if (target.name === 'impacts') {
          target.checked ? impacts.setStyle(maps.styles.impacts) : impacts.setStyle(new ol.style.Style({}))
        } else if (target.name === 'rain') {
          target.checked ? rain.setStyle(maps.styles.rain) : rain.setStyle(new ol.style.Style({}))
        } else if (target.name === 'severeFloodWarnings') { {
          // flood centroids
          floodCentroids.getSource().forEachFeature(function (feature) {
            console.log(feature)
            if (feature.get('severity') === severity) {
              feature.setStyle(visible ? null : new ol.style.Style({}))
            }
          })
        }    
        */ 
      /*
      switch (target.name) {
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
          // setFloodsVisibility(1, target.checked)
          break
        }
        case 'floodWarnings': {
          // setFloodsVisibility(2, target.checked)
          break
        }
        case 'floodAlerts': {
          // setFloodsVisibility(3, target.checked)
          break
        }
        case 'floodExpired': {
          // setFloodsVisibility(4, target.checked)
          break
        }
        case 'impacts': {
          target.checked ? impacts.setStyle(maps.styles.impacts) : impacts.setStyle(new ol.style.Style({}))
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
      */

    //
    // External methods
    //

    /*
    map.showFeatureSet = function (state) {
      // Set layers in key
      var layers = document.querySelectorAll('.govuk-checkboxes__input')
      layers.forEach(input => {
        if (input.id === 'severeFloodWarnings') {
          input.checked = state === 'target-areas' || state === 'severe' ? 'checked' : ''
        } else if (input.id === 'floodWarnings') {
          input.checked = state === 'target-areas' || state === 'warning' ? 'checked' : ''
        } else if (input.id === 'floodAlerts') {
          input.checked = state === 'target-areas' || state === 'alert' ? 'checked' : ''
        } else if (input.id === 'impacts') {
          input.checked = state === 'impacts' ? 'checked' : ''
        } else if (input.id === 'stations') {
          input.checked = state === 'stations' ? 'checked' : ''
        } else if (input.id === 'rain') {
          input.checked = state === 'rain' ? 'checked' : ''
        }
      })
      // Set layers and/or features on map
      map.getLayers().forEach(function (layer) {
        if (layer.get('ref') === 'floods-severe') {
          state === 'target-areas' || state === 'severe' ? layer.setVisible(true) : layer.setVisible(false)
        } else if (layer.get('ref') === 'floods-warning') {
          state === 'target-areas' || state === 'warning' ? layer.setVisible(true) : layer.setVisible(false)
        } else if (layer.get('ref') === 'floods-alert') {
          state === 'target-areas' || state === 'alert' ? layer.setVisible(true) : layer.setVisible(false)
        } else if (layer.get('ref') === 'flood-centroids') {
          layer.getSource().forEachFeature(function (feature) {
            feature.get('severity') === 3 && (state === 'target-areas' || state === 'alert') ? feature.setStyle(null) : feature.setStyle(new ol.style.Style({}))
            feature.get('severity') === 2 && (state === 'target-areas' || state === 'warning') ? feature.setStyle(null) : feature.setStyle(new ol.style.Style({}))
            feature.get('severity') === 1 && (state === 'target-areas' || state === 'severe') ? feature.setStyle(null) : feature.setStyle(new ol.style.Style({}))
          })
          state === 'target-areas' || state === 'severe' || state === 'warning' || state === 'alert' ? layer.setVisible(true) : layer.setVisible(false)
        } else if (layer.get('ref') === 'impacts') {
          state === 'impacts' ? layer.setStyle(maps.styles.impacts) : layer.setStyle(new ol.style.Style({}))
        } else if (layer.get('ref') === 'stations') {
          state === 'stations' ? layer.setStyle(maps.styles.stations) : layer.setStyle(new ol.style.Style({}))
        } else if (layer.get('ref') === 'rain') {
          state === 'rain' ? layer.setStyle(maps.styles.rain) : layer.setStyle(new ol.style.Style({}))
        }
      })
    }
    */

    //
    // Events
    //

    // Precompose - setup view and features first
    map.once('precompose', function (e) {
      // Set map extent to intial extent
      const extent = getParameterByName('e') ? getParameterByName('e').split(',').map(Number) : maps.extent
      map.getView().fit(extent, { constrainResolution: false, padding: [0, 0, 0, 0] })
      // Set initial layer views from querystring
      if (getParameterByName('l')) {
        var layers = getParameterByName('l').split(',')
        keyForm.querySelector('#severeFloodWarnings').checked = layers.includes('sw') ? true : false
        keyForm.querySelector('#floodWarnings').checked = layers.includes('w') ? true : false
        keyForm.querySelector('#floodAlerts').checked = layers.includes('a') ? true : false
        keyForm.querySelector('#impacts').checked = layers.includes('i') ? true : false
        keyForm.querySelector('#stations').checked = layers.includes('s') ? true : false
        keyForm.querySelector('#rain').checked = layers.includes('r') ? true : false
      }
    })

    // Only way to determin all layers have been loaded as
    // 'rendercomplete' sometimes fires before layers are loaded
    var layerLoadedCount = 0
    map.getLayers().forEach(function (layer) {
      if (layer.getSource()) {
        layer.getSource().on('change', function (e) {
          if (this.getState() === 'ready') {
            layerLoadedCount +=1
            if (layerLoadedCount >= 6) {
              // All layers are loaded (we only need 6 of the 7)
              updateKeyAndCanvas()
              setFeatureSetVisibility()
            }
          }
        })
      }
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
      // setFloodsOpacity(layerOpacity)
      // Key icons
      if (resolution <= mapOptions.minIconResolution) {
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
      const extent = map.getView().calculateExtent().join(',')
      // const extent = ol.proj.transformExtent(e.split(','), 'EPSG:3857', 'EPSG:4326')
      const state = { v: elementId }
      const url = addOrUpdateParameter(window.location.pathname + window.location.search, 'e', extent)
      const title = document.title
      window.history.replaceState(state, title, url)
      updateKeyAndCanvas()
    })

    // Close key or place locator if map is clicked
    map.addEventListener('click', async function (e) {
      // Get mouse coordinates and check for feature if not the highlighted flood polygon
      var feature = map.forEachFeatureAtPixel(e.pixel, function (feature) {
        return feature
      })
      /*
      , {
        layerFilter: function (layer) {
          return layer.get('ref') !== 'flood-polygon'
        }
      })
      */

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
        // Clear out pre selected polygon
        setFloodPolygonSource()
        // Clear out pre selected point
        setSelectedPointFeatureSource()
      }
      /*
      else {
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
      */
    })

    // Show cursor when hovering over features
    map.addEventListener('pointermove', function (e) {
      // Detect vector feature at mouse coords
      var hit = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        return true
      })

      // Detect wms image at mouse coords
      /*
      if (!hit) {
        hit = getFloodLayer(e.pixel)
      }
      */

      if (hit) {
        map.getTarget().style.cursor = 'pointer'
      } else {
        map.getTarget().style.cursor = ''
      }
    })

    // Key input change
    keyForm.addEventListener('change', function (e) {
      setFeatureSetVisibility()
      // Update key and canvas
      // updateKeyAndCanvas()
      // Update url layers
      var sw = keyForm.querySelector('#severeFloodWarnings').checked ? 'sw' : ''
      var w = keyForm.querySelector('#floodWarnings').checked ? 'w' : ''
      var a = keyForm.querySelector('#floodAlerts').checked ? 'a' : ''
      var i = keyForm.querySelector('#impacts').checked ? 'i' : ''
      var s = keyForm.querySelector('#stations').checked ? 's' : ''
      var r = keyForm.querySelector('#rain').checked ? 'r' : ''
      var l = [i, s, r, a, w, sw].filter(Boolean).join(',')
      const url = addOrUpdateParameter(window.location.pathname + window.location.search, 'l', l)
      const title = document.title
      window.history.replaceState(null, title, url)
    })

    // Overlay river level navigation button click
    document.querySelector('.ol-overlaycontainer-stopevent').addEventListener('click', async function (e) {
      if (e.target.classList.contains('overlay-navigation-button')) {
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

    // Toggle fullscreen view on browser history change
    function popStateListener (e) {
      if (e && e.state && getParameterByName('v') === elementId) {
        window.removeEventListener('popstate', popStateListener)
        maps.createLiveMap()
        window.flood.historyAdvanced = true
      } else {
        var el = document.getElementById(elementId)
        if (el.firstChild) {
          el.removeChild(el.firstChild)
        }
      }
    }
    window.addEventListener('popstate', popStateListener)

    this.map = map
    this.container = container
  }

  // Export a helper factory to create this map
  // onto the `maps` object.
  // (This is done mainly to avoid the rule
  // "do not use 'new' for side effects. (no-new)")
  maps.createLiveMap = function (queryStringParameters = {}) {
    return new LiveMap(queryStringParameters)
  }
})(window, window.flood)
