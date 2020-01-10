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

  function LiveMap (containerId, display) {
    // Container element
    const containerEl = document.getElementById(containerId)

    // Internal objects used to store state of layers, orginial and new extent and selected feature properties
    // 'ts': Target Area Severe, 'st': Stations etc. 'inp': Input checked boolean and 'vpt': Within wiewport boolean
    var layers = { ts: {}, tw: {}, ta: {}, hi: {}, st: {}, rf: {} }
    Object.keys(layers).forEach(function (key) { layers[key] = { inp: false, vpt: false } })
    // Used to store orignal extent and new extent to enable reset extent option 
    var extent = { org: maps.extent, new: maps.extent }
    // Used to store selected feature
    var selected

    // Layers
    var road = maps.layers.road()
    var satellite = maps.layers.satellite()
    var polygons = maps.layers.polygons()
    var floods = maps.layers.floods()
    var stations = maps.layers.stations()
    var rain = maps.layers.rain()
    var impacts = maps.layers.impacts()
    var top = maps.layers.top()

    // View
    var view = new ol.View({
      zoom: 6,
      minZoom: 6,
      maxZoom: 18,
      center: maps.center
    })

    // MapContainer options
    var options = {
      minIconResolution: 200,
      view: view,
      keyTemplate: 'map-key-live.html',
      display: display,
      layers: [
        road,
        satellite,
        polygons,
        rain,
        stations,
        impacts,
        floods,
        top
      ]
    }

    // Create MapContainer
    var container = new MapContainer(containerEl, options)
    var map = container.map
    var key = container.keyElement

    //
    // Map internal methods
    //

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
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return dateTime.setHours(0, 0, 0, 0) === tomorrow.setHours(0, 0, 0, 0)
      }
      const isYesterday = (dateTime) => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return dateTime.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0)
      }
      var date = hours + ':' + minutes + amPm
      if (isToday(dateTime)) {
        date += ' today'
      } else if (isTomorrow(dateTime)) {
        date += ' tomorrow'
      } else if (isYesterday(dateTime)) {
        date += ' yesterday'
      } else {
        date += ' on ' + day + '/' + month + '/' + year
      }
      return date
    }

    // Load tooltip
    async function ensureFeatureTooltipHtml (feature) {
      var id = feature.getId()
      const trimId = id.replace('stations.', '')
      var props = feature.getProperties()
      if (props.value_date) {
        props.value_date_tooltip = toolTipDate(new Date(props.value_date))
      }
      if (props.ffoi_date) {
        props.ffoi_date_tooltip = toolTipDate(new Date(props.ffoi_date))
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
              const response = await window.fetch(upDownUrl)
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
        } else if (id.startsWith('flood')) {
          html = window.nunjucks.render('tooltip.html', {
            type: 'warnings',
            props: props
          })
        } else if (id.startsWith('rain')) {
          // Get rainfall data for station
          const rainfallData = async () => {
            const rainfallUrl = '/rain-gauge-tooltip/' + props.stationReference + '/' + props.label + '/100'
            try {
              const response = await window.fetch(rainfallUrl)
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

    // Update Key ul's and li's and <canvas> content
    function updateKeyCanvasHtml () {
      extent.new = map.getView().calculateExtent()
      // Feature groups that are within the current viewport
      // Update state for polygons
      polygons.getSource().forEachFeatureInExtent(extent.new, function (feature) {
        if (feature.get('severity') === 1) {
          layers.ts.vpt = true
        } else if (feature.get('severity') === 2) {
          layers.tw.vpt = true
        } else if (feature.get('severity') === 3) {
          layers.ta.vpt = true
        }
      })
      // Set booleans for flood centroids
      floods.getSource().forEachFeatureInExtent(extent.new, function (feature) {
        if (feature.get('severity') === 1) {
          layers.ts.vpt = true
        } else if (feature.get('severity') === 2) {
          layers.tw.vpt = true
        } else if (feature.get('severity') === 3) {
          layers.ta.vpt = true
        }
      })
      // Set booleans for remaining centroids
      layers.hi.vpt = !!impacts.getSource().getFeaturesInExtent(extent.new).length
      layers.st.vpt = !!stations.getSource().getFeaturesInExtent(extent.new).length
      layers.rf.vpt = !!rain.getSource().getFeaturesInExtent(extent.new).length
      // Conditionally show 'ul' and/or 'li' elements
      forEach(key.querySelectorAll('input:not([type="radio"])'), function (input) {
        if (['ts','tw','ta'].includes(input.id)) {
          input.closest('li').style.display = layers[input.id].vpt ? 'block' : 'none'
          input.closest('ul').style.display = layers.ts.vpt || layers.tw.vpt || layers.ta.vpt ? 'block' : 'none'
        } else {
          input.closest('ul').style.display = layers[input.id].vpt ? 'block' : 'none'
        }
      })
    }

    // Set the selected feature
    function setSelectedFeature (feature) {
      // A new feature has been selected
      feature.set('isSelected', true)
      if (feature.getGeometry().getType() === 'Point') {
        top.getSource().addFeature(feature)
        var id = feature.getId()
        if (id.startsWith('impacts')) {
          top.setStyle(maps.styles.impacts)
        } else if (id.startsWith('stations')) {
          top.setStyle(maps.styles.stations)
        } else if (id.startsWith('flood')) {
          top.setStyle(maps.styles.floods)
        } else if (id.startsWith('rain')) {
          top.setStyle(maps.styles.rain)
        } else {
          top.setStyle(maps.styles.location)
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
      extent.new = map.getView().calculateExtent(map.getSize())
    }

    // Layer visibility
    function setFeatureVisibility() {
      map.getLayers().forEach(function (layer) {
        if (layer.get('ref') === 'road') {
          road.setVisible(document.getElementById('mv').checked ? true : false) 
        } else if (layer.get('ref') === 'satellite') {
          satellite.setVisible(document.getElementById('sv').checked ? true : false)
        } else if (layer.get('ref') === 'floods' || layer.get('ref') === 'polygons') {
          layer.getSource().forEachFeature(function (feature) {
            var severity = feature.get('severity')
            feature.set('isVisible', (severity === 3 && layers.ta.inp) || (severity === 2 && layers.tw.inp) || (severity === 1 && layers.ts.inp) ? true : false)
            // Set isSelected paired polygon and flood feature
            feature.set('isSelected', selected && selected.get('fwa_code') === feature.get('fwa_code') ? true : false)
          })
        } else if (layer.get('ref') === 'stations') {
          layers.st.inp ? stations.setStyle(maps.styles.stations) : stations.setStyle(new ol.style.Style({}))
        } else if (layer.get('ref') === 'impacts') {
          layers.hi.inp ? impacts.setStyle(maps.styles.impacts) : impacts.setStyle(new ol.style.Style({}))
        } else if (layer.get('ref') === 'rain') {
          layers.rf.inp ? rain.setStyle(maps.styles.rain) : rain.setStyle(new ol.style.Style({}))
        }
      })
    }

    //
    // Map external methods
    //

    // Add locator
    map.addLocator = function (name, coordinates) {
      map.addLayer(maps.layers.location(name, coordinates))
    }

    //
    // Map events
    //

    // Precompose - setup view and layers. Fires before features have been loaded
    map.once('precompose', function (e) {
      // Set map extent from querystring
      if (getParameterByName('ext')) {
        extent.org = getParameterByName('ext').split(',').map(Number)
        extent.org = ol.proj.transformExtent(extent.org, 'EPSG:4326', 'EPSG:3857')
      }
      map.getView().fit(extent.org, { constrainResolution: false, padding: [10, 10, 10, 10] })
      // Set initial layer views from querystring
      if (getParameterByName('lyr')) {
        var lyr = getParameterByName('lyr').split(',')
        // Update state object from querystring
        Object.keys(layers).forEach(function (key) { layers[key].inp = lyr.includes(key) })
        // Update input checked state in key
        forEach(key.querySelectorAll('input:not([type="radio"])'), function (input) {
          input.checked = layers[input.id].inp
        })
      }
    })

    // Only way to determin all features in the current viewport have been loaded as
    // 'rendercomplete' sometimes fires before layers are loaded
    var lyrReady = { polygons: false, floods: false, stations: false, impacts: false, rain: false }
    map.getLayers().forEach(function (layer) {
      if (layer.getSource() && Object.keys(lyrReady).includes(layer.get('ref'))) {
        var allReady = layer.getSource().on('change', function (e) {
          if (this.getState() === 'ready') {
            lyrReady[layer.get('ref')] = true
            // Remove allReady when layer is ready
            ol.Observable.unByKey(allReady)
            // Set initial selected feature from querystring
            if (getParameterByName('fid') && !selected) {
              selected = layer.getSource().getFeatureById(getParameterByName('fid'))       
            }
            // All features are loaded for current viewport
            if ((lyrReady.polygons || lyrReady.floods) && lyrReady.stations && lyrReady.impacts && lyrReady.rain) {
              updateKeyCanvasHtml()
              setFeatureVisibility()
            }
          }
        })
      }
    })

    // Fix window.onresize and bbox strategy
    map.on('change', function (e) {
      console.log('Map change')
    })

    // Reactions based on pan/zoom change on map
    var timer = null
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
      // Key icons
      forEach(key.querySelectorAll('[data-style]'), function (symbol) {
        var style = symbol.getAttribute('data-style')
        var offsetStyle = symbol.getAttribute('data-style-offset')
        symbol.style = resolution <= options.minIconResolution ? offsetStyle : style 
      })
      // Update history state (url) to reflect new extent
      extent.new = map.getView().calculateExtent(map.getSize())
      var ext = ol.proj.transformExtent(extent.new, 'EPSG:3857', 'EPSG:4326')
      ext = ext.map(function (x) { return Number(x.toFixed(6)) })
      ext = ext.join(',')
      var state = { v: containerId }
      var url = addOrUpdateParameter(window.location.pathname + window.location.search, 'ext', ext)
      var title = document.title
      // Timer used to stop 100 replaces in 30 seconds limit
      clearTimeout(timer)
      timer = setTimeout(function () {
        window.history.replaceState(state, title, url)
      }, 350)
      // Use of bbox loading means we have new features each time the map pan/zooms
      updateKeyCanvasHtml()
      setFeatureVisibility()
    })

    // Close key or select feature if map is clicked
    map.addEventListener('click', async function (e) {
      // Remove any previous selected feature
      if (selected) {
        selected.set('isSelected', false)
        selected = void 0
        setFeatureVisibility()
        top.getSource().clear()
      }
      // Get mouse coordinates and check for feature
      var feature = map.forEachFeatureAtPixel(e.pixel, function (feature) { return feature })
      if (feature) {
        selected = feature
        setSelectedFeature(selected)
      }
    })

    // Show cursor when hovering over features
    map.addEventListener('pointermove', function (e) {
      // Detect vector feature at mouse coords
      var hit = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        return true
      })
      map.getTarget().style.cursor = hit ? 'pointer' : ''
    })

    // Key input change
    key.addEventListener('change', function (e) {
      if (e.target.nodeName.toLowerCase() === 'input') {
        var input = e.target
        layers[input.id].inp = input.checked
        // Update history state (url) to reflect new layer choices
        var lyr = Object.keys(layers).filter(key => layers[key].inp).join(',')
        const url = addOrUpdateParameter(window.location.pathname + window.location.search, 'lyr', lyr)
        const title = document.title
        window.history.replaceState(null, title, url)
        // Changing layers requires features and Html to be updated
        updateKeyCanvasHtml()
        setFeatureVisibility()
      }
    })

    // Overlay river level navigation button click
    document.addEventListener('click', async function (e) {
      //document.querySelector('.ol-overlaycontainer-stopevent').addEventListener('click', async function (e) {
      if (e.target.classList.contains('overlay-navigation-button')) {
        var nextStationId = e.target.getAttribute('data-id')
        var feature = stations.getSource().getFeatureById(nextStationId)
        container.selectedFeature.set('isSelected', false)
        setSelectedSource()
        feature.set('isSelected', true)
        container.selectedFeature = feature
        panMap(feature)
        await ensureFeatureTooltipHtml(feature)
        container.showOverlay(feature)
      }
      //})
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
          setSelectedSource(new ol.source.Vector({
            features: [feature],
            format: new ol.format.GeoJSON()
          }))
        }
      }
    })

    // External properties
    this.container = container
    this.map = map
  }

  // Export a helper factory to create this map
  // onto the `maps` object.
  // (This is done mainly to avoid the rule
  // "do not use 'new' for side effects. (no-new)")
  maps.createLiveMap = function (containerId, display = {}) {
    return new LiveMap(containerId, display)
  }
})(window, window.flood)
