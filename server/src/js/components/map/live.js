'use strict'
// This file represents the main map used in constious pages
// across the site. It includes flood warnings, river levels
// and other layers in the future e.g. Impacts.

// It uses the MapContainer

import { View, Overlay, Feature } from 'ol'
import { transform, transformExtent } from 'ol/proj'
import { unByKey } from 'ol/Observable'
import { defaults as defaultInteractions } from 'ol/interaction'
import { Point, MultiPolygon } from 'ol/geom'
import { buffer, containsExtent, getCenter } from 'ol/extent'
import { Vector as VectorSource } from 'ol/source'

const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const maps = window.flood.maps
const { setExtentFromLonLat, getLonLatFromExtent } = window.flood.maps
const MapContainer = maps.MapContainer

function LiveMap (mapId, options) {
  // Set maxBigZoom value
  maps.liveMaxBigZoom = 100

  // Optional target area features
  const targetArea = {}

  // State object
  const state = {
    visibleFeatures: [],
    selectedFeatureId: '',
    initialExt: [],
    hasOverlays: false
  }

  // View
  const view = new View({
    zoom: 6, // Default zoom
    minZoom: 6, // Minimum zoom level
    maxZoom: 18,
    center: maps.centre, // Default centre required
    extent: maps.extentLarge // Constrains extent
  })

  // Layers
  const road = maps.layers.road()
  const satellite = maps.layers.satellite()
  const targetAreaPolygons = maps.layers.targetAreaPolygons()
  const warnings = maps.layers.warnings()
  const stations = maps.layers.stations()
  const impacts = maps.layers.impacts()
  const selected = maps.layers.selected()

  // These layers are static
  const defaultLayers = [
    road,
    satellite,
    selected
  ]

  // These layers can be manipulated
  const dataLayers = [
    stations,
    warnings,
    impacts
  ]
  const layers = defaultLayers.concat(dataLayers)

  // Configure default interactions
  const interactions = defaultInteractions({
    pinchRotate: false
  })

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    maxBigZoom: maps.liveMaxBigZoom,
    view: view,
    layers: layers,
    queryParamKeys: ['v', 'lyr', 'ext', 'fid'],
    interactions: interactions,
    originalTitle: options.originalTitle,
    title: options.title,
    heading: options.heading,
    keyTemplate: 'key-live.html',
    isBack: options.isBack
  }

  // Create MapContainer
  const container = new MapContainer(mapId, containerOptions)
  const map = container.map
  const containerElement = container.containerElement
  const viewport = container.viewport
  const viewportDescription = container.viewportDescription
  const keyElement = container.keyElement
  const resetButton = container.resetButton
  const closeInfoButton = container.closeInfoButton
  const openKeyButton = container.openKeyButton
  // const keyboardButton = container.keyboardButton

  //
  // Private methods
  //

  // Compare two lonLat extent arrays and return true if they are different
  const isNewExtent = (newExt) => {
    // Check either lons or lats are the same
    const isSameLon1 = newExt[0] < (state.initialExt[0] + 0.0001) && newExt[0] > (state.initialExt[0] - 0.0001)
    const isSameLon2 = newExt[2] < (state.initialExt[2] + 0.0001) && newExt[2] > (state.initialExt[2] - 0.0001)
    const isSameLat1 = newExt[1] < (state.initialExt[1] + 0.0001) && newExt[1] > (state.initialExt[1] - 0.0001)
    const isSameLat2 = newExt[3] < (state.initialExt[3] + 0.0001) && newExt[3] > (state.initialExt[3] - 0.0001)
    const isSameWidth = isSameLon1 && isSameLon2
    const isSameHeight = isSameLat1 && isSameLat2
    // Check extent is within original extent
    const initialExtent = transformExtent(state.initialExt, 'EPSG:4326', 'EPSG:3857')
    const newExtent = transformExtent(newExt, 'EPSG:4326', 'EPSG:3857')
    const isNewWithinInitital = containsExtent(newExtent, initialExtent)
    return !((isSameWidth || isSameHeight) && isNewWithinInitital)
  }

  // Show or hide layers
  const setLayerVisibility = (lyrCodes) => {
    dataLayers.forEach((layer) => {
      const isVisible = lyrCodes.some(lyrCode => layer.get('featureCodes').includes(lyrCode))
      layer.setVisible(isVisible)
    })
    road.setVisible(lyrCodes.includes('mv'))
    satellite.setVisible(lyrCodes.includes('sv'))
    // Overide wanrings visibility if target area provided
    if (targetArea.pointFeature) {
      warnings.setVisible(true)
    }
  }

  // WebGL: Limited dynamic styling could be done server side
  const setFeatueState = (layer) => {
    layer.getSource().forEachFeature((feature) => {
      const props = feature.getProperties()
      let state = 'normal'
      // Stations
      if (props.status === 'Suspended' || props.status === 'Closed' || (!props.value && !props.iswales)) {
        state = 'error'
      } else if (props.value && props.atrisk && props.type !== 'C' && !props.iswales) {
        state = 'high'
      }
      // WebGl: Feature properties must be strings or numbers
      feature.set('state', state)
    })
  }

  // Show or hide features within layers
  const setFeatureVisibility = (lyrCodes, layer) => {
    layer.getSource().forEachFeature((feature) => {
      const ref = layer.get('ref')
      const props = feature.getProperties()
      const isHighLevel = props.atrisk && props.status === 'Active' && props.value && props.type !== 'C' && !props.iswales
      const isVisible = (
        // Warnings
        (props.severity_value && props.severity_value === 3 && lyrCodes.includes('ts')) ||
        (props.severity_value && props.severity_value === 2 && lyrCodes.includes('tw')) ||
        (props.severity_value && props.severity_value === 1 && lyrCodes.includes('ta')) ||
        (props.severity_value && props.severity_value === 4 && lyrCodes.includes('tr')) ||
        // Stations
        (ref === 'stations' && isHighLevel && lyrCodes.includes('sh')) ||
        (ref === 'stations' && !isHighLevel && lyrCodes.includes('st')) ||
        // Impacts
        (ref === 'impacts' && lyrCodes.includes('hi')) ||
        // Target area provided
        (targetArea.pointFeature && targetArea.pointFeature.getId() === feature.getId())
      )
      // WebGl: Feature properties must be strings or numbers
      feature.set('isVisible', Boolean(isVisible).toString())
    })
  }

  // Set selected feature
  const setSelectedFeature = (newFeatureId = '') => {
    selected.getSource().clear()
    dataLayers.forEach((layer) => {
      const originalFeature = layer.getSource().getFeatureById(state.selectedFeatureId)
      const newFeature = layer.getSource().getFeatureById(newFeatureId)
      if (originalFeature) {
        originalFeature.set('isSelected', false)
      }
      if (newFeature) {
        newFeature.set('isSelected', true)
        setFeatureHtml(newFeature)
        selected.getSource().addFeature(newFeature)
        selected.setStyle(maps.styles[layer.get('ref')]) // WebGL: layers don't use a style function
        container.showInfo('Selected feature information', newFeature.get('html'))
      }
      // Refresh target area polygons
      if (layer.get('ref') === 'warnings') {
        targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
      }
      // Toggle overlay selected state
      if (state.hasOverlays) {
        if (originalFeature && map.getOverlayById(state.selectedFeatureId)) {
          const overlayElement = map.getOverlayById(state.selectedFeatureId).getElement().parentNode
          overlayElement.classList.remove('defra-key-symbol--selected')
        }
        if (newFeature && map.getOverlayById(newFeatureId)) {
          const overlayElement = map.getOverlayById(newFeatureId).getElement().parentNode
          overlayElement.classList.add('defra-key-symbol--selected')
        }
      }
    })
    state.selectedFeatureId = newFeatureId
    // Update url
    replaceHistory('fid', newFeatureId)
  }

  // Toggle key symbols based on resolution
  const toggleKeySymbol = () => {
    forEach(containerElement.querySelectorAll('.defra-map-key__symbol'), (symbol) => {
      const isBigZoom = map.getView().getResolution() <= maps.liveMaxBigZoom
      isBigZoom ? symbol.classList.add('defra-map-key__symbol--big') : symbol.classList.remove('defra-map-key__symbol--big')
    })
  }

  // Update url and replace history state
  const replaceHistory = (key, value) => {
    const data = { v: mapId, isBack: options.isBack, initialExt: state.initialExt }
    const uri = addOrUpdateParameter(window.location.href, key, value)
    const title = document.title
    window.history.replaceState(data, title, uri)
  }

  // Generate feature name
  const featureName = (feature) => {
    let name = ''
    if (feature.get('type') === 'C') {
      name = `Sea level measurement: ${feature.get('name')}`
    } else if (feature.get('type') === 'S' || feature.get('type') === 'M') {
      name = `River level measurement: ${feature.get('name')}, ${feature.get('river')}`
    } else if (feature.get('type') === 'G') {
      name = `Groundwater measurement: ${feature.get('name')}`
    } else if (feature.get('severity_value') === 3) {
      name = `Severe flood warning: ${feature.get('ta_name')}`
    } else if (feature.get('severity_value') === 2) {
      name = `Flood warning: ${feature.get('ta_name')}`
    } else if (feature.get('severity_value') === 1) {
      name = `Flood alert: ${feature.get('ta_name')}`
    }
    return name
  }

  // Get features visible in the current viewport
  const getVisibleFeatures = () => {
    const features = []
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    const resolution = map.getView().getResolution()
    const extent = map.getView().calculateExtent(map.getSize())
    const isBigZoom = resolution <= maps.liveMaxBigZoom
    const layers = dataLayers.filter(layer => lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
    if (!layers.includes(warnings) && targetArea.pointFeature) {
      layers.push(warnings)
    }
    layers.forEach((layer) => {
      layer.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
        if (!feature.get('isVisible')) { return false }
        features.push({
          id: feature.getId(),
          name: featureName(feature),
          state: layer.get('ref'), // Used to style the overlay
          isBigZoom: isBigZoom,
          centre: feature.getGeometry().getCoordinates()
        })
      })
    })
    return features
  }

  // Show overlays
  const showOverlays = () => {
    state.visibleFeatures = getVisibleFeatures()
    const numFeatures = state.visibleFeatures.length
    const numWarnings = state.visibleFeatures.filter((feature) => feature.state === 'warnings').length
    const mumMeasurements = state.visibleFeatures.filter((feature) => feature.state === 'stations').length
    const features = state.visibleFeatures.slice(0, 9)
    // Show visual overlays
    hideOverlays()
    if (maps.isKeyboard && numFeatures >= 1 && numFeatures <= 9) {
      state.hasOverlays = true
      features.forEach((feature, i) => {
        const overlayElement = document.createElement('span')
        overlayElement.setAttribute('aria-hidden', true)
        overlayElement.innerText = i + 1
        const selected = feature.id === state.selectedFeatureId ? 'defra-key-symbol--selected' : ''
        map.addOverlay(
          new Overlay({
            id: feature.id,
            element: overlayElement,
            position: feature.centre,
            className: `defra-key-symbol defra-key-symbol--${feature.state}${feature.isBigZoom ? '-bigZoom' : ''} ${selected}`,
            offset: [0, 0]
          })
        )
      })
    }
    // Show non-visual feature details
    const model = {
      numFeatures: numFeatures,
      numWarnings: numWarnings,
      mumMeasurements: mumMeasurements,
      features: features
    }
    const html = window.nunjucks.render('description-live.html', { model: model })
    viewportDescription.innerHTML = html
  }

  // Hide overlays
  const hideOverlays = () => {
    state.hasOverlays = false
    map.getOverlays().clear()
  }

  // Set target area polygon opacity
  const setOpacityTargetAreaPolygons = () => {
    // Hide or show layer depending on resolution
    const resolution = Math.floor(map.getView().getResolution())
    targetAreaPolygons.setVisible(resolution < maps.liveMaxBigZoom)
    // Opacity graduates with zoom
    targetAreaPolygons.setOpacity((-Math.abs(map.getView().getZoom()) + 20) / 10)
  }

  // Pan map
  const panToFeature = (feature) => {
    let extent = map.getView().calculateExtent(map.getSize())
    extent = buffer(extent, -1000)
    if (!containsExtent(extent, feature.getGeometry().getExtent())) {
      map.getView().setCenter(feature.getGeometry().getCoordinates())
    }
  }

  // Time format function
  const formatTime = (date) => {
    const hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
    const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
    const amPm = (date.getHours() > 12) ? 'pm' : 'am'
    return hours + ':' + minutes + amPm
  }

  // Day format function
  const formatDay = (date) => {
    const day = date.getDate()
    const nth = (day) => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th' }
    }
    const shortDay = date.toLocaleString('en-GB', { weekday: 'short' })
    const today = new Date()
    const yesterday = new Date()
    const tomorrow = new Date()
    today.setHours(0, 0, 0, 0)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    if (date.getTime() === today.getTime()) {
      return 'today'
    } else if (date.getTime() === yesterday.getTime()) {
      return 'yesterday'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'tomorrow'
    } else {
      return ' on ' + shortDay + ' ' + date.getDate() + nth(day)
    }
  }

  // Set feature overlay html
  const setFeatureHtml = (feature) => {
    const model = feature.getProperties()
    model.id = feature.getId().substring(feature.getId().indexOf('.') + 1)
    // Format dates for river levels
    if (feature.getId().startsWith('stations')) {
      model.date = formatTime(new Date(model.value_date)) + ' ' + formatDay(new Date(model.value_date))
    }
    const html = window.nunjucks.render('info-live.html', { model: model })
    feature.set('html', html)
  }

  //
  // Setup
  //

  // Set initial selected feature id
  if (getParameterByName('fid')) {
    state.selectedFeatureId = getParameterByName('fid')
  }

  // Create optional target area feature
  if (options.targetArea) {
    if (options.targetArea.polygon) { // Vector source
      // Create polygon feature
      targetArea.polygonFeature = new Feature({
        geometry: new MultiPolygon(options.targetArea.polygon).transform('EPSG:4326', 'EPSG:3857')
      })
      // Create point feature
      targetArea.pointFeature = new Feature({
        geometry: new Point(getCenter(targetArea.polygonFeature.getGeometry().getExtent())),
        ta_code: options.targetArea.id,
        ta_name: options.targetArea.name
      })
      targetArea.pointFeature.setId('flood.' + options.targetArea.id)
      // Transform id
      const featureId = 'flood_warning_alert.' + options.targetArea.id
      targetArea.polygonFeature.setId(featureId)
    } else if (options.targetArea.centre) { // Vector tile source
      // Create point feature
      targetArea.pointFeature = new Feature({
        geometry: new Point(transform(options.targetArea.centre, 'EPSG:4326', 'EPSG:3857')),
        name: options.targetArea.name
      })
      targetArea.pointFeature.setId(options.targetArea.id)
    }
  }

  // Define map extent
  let extent
  if (getParameterByName('ext')) {
    extent = getParameterByName('ext').split(',').map(Number)
  } else if (options.extent && options.extent.length) {
    extent = options.extent.map(x => { return parseFloat(x.toFixed(6)) })
  } else if (targetArea.polygonFeature) {
    extent = getLonLatFromExtent(buffer(targetArea.polygonFeature.getGeometry().getExtent(), 150))
  } else {
    extent = getLonLatFromExtent(maps.extent)
  }

  // Set map viewport
  if (!getParameterByName('ext') && options.centre) {
    map.getView().setCenter(transform(options.centre, 'EPSG:4326', 'EPSG:3857'))
    map.getView().setZoom(options.zoom || 6)
  } else {
    setExtentFromLonLat(map, extent)
  }

  // Store extent for use with reset button
  state.initialExt = window.history.state.initialExt || getLonLatFromExtent(map.getView().calculateExtent(map.getSize()))

  // Set layers from querystring
  if (getParameterByName('lyr')) {
    const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
    setLayerVisibility(lyrs)
    const checkboxes = document.querySelectorAll('.defra-map-key input[type=checkbox]')
    forEach(checkboxes, (checkbox) => {
      checkbox.checked = lyrs.includes(checkbox.id)
    })
    const radios = document.querySelectorAll('.defra-map-key input[type=radio]')
    forEach(radios, (radio) => {
      radio.checked = lyrs.includes(radio.id)
    })
  }

  //
  // Events
  //

  // Set selected feature and polygon states when features have loaded
  dataLayers.forEach((layer) => {
    const change = layer.getSource().on('change', (e) => {
      if (e.target.getState() === 'ready') {
        unByKey(change) // Remove ready event when layer is ready
        if (layer.get('ref') === 'warnings') {
          // Add optional target area
          if (targetArea.pointFeature) {
            if (!warnings.getSource().getFeatureById(targetArea.pointFeature.getId())) {
              // Add point feature
              warnings.getSource().addFeature(targetArea.pointFeature)
              // VectorSource: Add polygon not required if VectorTileSource
              if (targetArea.polygonFeature && targetAreaPolygons.getSource() instanceof VectorSource) {
                targetAreaPolygons.getSource().addFeature(targetArea.polygonFeature)
              }
            }
          }
        }
        // WebGL: Limited dynamic styling could be done server side for client performance
        if (layer.get('ref') === 'stations') {
          setFeatueState(layer)
        }
        // Set feature visibility after all features have loaded
        const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
        setFeatureVisibility(lyrs, layer)
        // Store reference to warnings source for use in vector tiles style function
        if (layer.get('ref') === 'warnings') {
          maps.warningsSource = warnings.getSource()
          map.addLayer(targetAreaPolygons)
        }
        // Attempt to set selected feature when layer is ready
        setSelectedFeature(state.selectedFeatureId)
        // Show overlays
        showOverlays()
      }
    })
  })

  // Set key symbols, opacity, history and overlays on map pan or zoom (fires on map load aswell)
  let timer = null
  map.addEventListener('moveend', (e) => {
    // Toggle key symbols depending on resolution
    toggleKeySymbol()
    // Set polygon layer opacity
    setOpacityTargetAreaPolygons()
    // Timer used to stop 100 url replaces in 30 seconds limit
    clearTimeout(timer)
    // Clear viewport description to force screen reader to re-read
    viewportDescription.innerHTML = ''
    // Tasks dependent on a time delay
    timer = setTimeout(() => {
      // Show overlays for visible features
      showOverlays()
      // Update url (history state) to reflect new extent
      const ext = getLonLatFromExtent(map.getView().calculateExtent(map.getSize()))
      replaceHistory('ext', ext.join(','))
      // Show reset button if extent has changed
      if (isNewExtent(ext)) {
        resetButton.removeAttribute('disabled')
      }
      // Fix margin issue
      map.updateSize()
    }, 350)
  })

  // Show cursor when hovering over features
  map.addEventListener('pointermove', (e) => {
    // Detect vector feature at mouse coords
    const hit = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (!defaultLayers.includes(layer)) { return true }
    })
    map.getTarget().style.cursor = hit ? 'pointer' : ''
  })

  // Set selected feature if map is clicked
  // Clear overlays if non-keyboard interaction
  map.addEventListener('click', (e) => {
    // Hide overlays if non-keyboard interaction
    if (!maps.isKeyboard) {
      hideOverlays()
    }
    // Get mouse coordinates and check for feature
    const featureId = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (!defaultLayers.includes(layer)) {
        let id = feature.getId()
        // Transform id for target area polygons
        if (layer.get('ref') === 'targetAreaPolygons') {
          id = id.includes('flood_warning_alert') ? 'flood' + id.substring(id.indexOf('.')) : 'flood.' + id
        }
        return id
      }
    })
    setSelectedFeature(featureId)
  })

  // Show overlays on first tab in from browser controls
  viewport.addEventListener('focus', (e) => {
    if (maps.isKeyboard) {
      showOverlays()
    }
  })

  // Toggle layers/features when key item clicked
  keyElement.addEventListener('click', (e) => {
    if (e.target.nodeName === 'INPUT') {
      e.stopPropagation()
      let lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
      if (e.target.type === 'checkbox') {
        const checkbox = e.target
        checkbox.checked ? lyrs.push(checkbox.id) : lyrs.splice(lyrs.indexOf(checkbox.id), 1)
        dataLayers.forEach((layer) => {
          setFeatureVisibility(lyrs, layer)
        })
      } else if (e.target.type === 'radio') {
        if (lyrs.includes('mv')) { lyrs.splice(lyrs.indexOf('mv'), 1) }
        if (lyrs.includes('sv')) { lyrs.splice(lyrs.indexOf('sv'), 1) }
        lyrs.push(e.target.id)
      }
      setLayerVisibility(lyrs)
      targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
      lyrs = lyrs.join(',')
      replaceHistory('lyr', lyrs)
      showOverlays()
    }
  })

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', (e) => {
    setSelectedFeature()
  })

  // Clear selectedfeature when key is opened
  openKeyButton.addEventListener('click', (e) => {
    setSelectedFeature()
  })

  // Reset map extent on reset button click
  resetButton.addEventListener('click', (e) => {
    setExtentFromLonLat(map, state.initialExt)
    resetButton.setAttribute('disabled', '')
    containerElement.focus()
  })

  // Handle all liveMap specific key presses
  containerElement.addEventListener('keyup', (e) => {
    // Show overlays when any key is pressed other than Escape
    if (e.key !== 'Escape') {
      showOverlays()
    }
    // Clear selected feature when pressing escape
    if (e.key === 'Escape' && state.selectedFeatureId !== '') {
      setSelectedFeature()
    }
    // Set selected feature on [1-9] key presss
    if (!isNaN(e.key) && e.key >= 1 && e.key <= state.visibleFeatures.length && state.visibleFeatures.length <= 9) {
      setSelectedFeature(state.visibleFeatures[e.key - 1].id)
    }
  })

  // River level navigation
  containerElement.addEventListener('click', (e) => {
    if (e.target.classList.contains('defra-map-info__button')) {
      const newFeatureId = e.target.getAttribute('data-id')
      const feature = stations.getSource().getFeatureById(newFeatureId)
      setSelectedFeature(newFeatureId)
      panToFeature(feature)
    }
  })
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createLiveMap = (mapId, options = {}) => {
  // Set meta title and page heading
  options.originalTitle = document.title
  options.heading = 'Live flood map'
  options.title = options.heading + ' - Check for flooding - GOV.UK'

  // Set initial history state
  if (!window.history.state) {
    const data = {}
    const title = options.title // document.title
    const uri = window.location.href
    window.history.replaceState(data, title, uri)
  }

  // Create map button
  const btnContainer = document.getElementById(mapId)
  const button = document.createElement('button')
  button.id = mapId + '-btn'
  button.innerHTML = options.btnText || 'View map'
  button.innerHTML += '<span class="govuk-visually-hidden">(Visual only)</span>'
  button.className = options.btnClasses || 'defra-button-map'
  btnContainer.parentNode.replaceChild(button, btnContainer)

  // Detect keyboard interaction
  window.addEventListener('keydown', (e) => {
    maps.isKeyboard = true
  })
  // Needs keyup to detect first tab into web area
  window.addEventListener('keyup', (e) => {
    maps.isKeyboard = true
  })
  window.addEventListener('pointerdown', (e) => {
    maps.isKeyboard = false
  })
  window.addEventListener('focusin', (e) => {
    if (maps.isKeyboard) {
      e.target.setAttribute('keyboard-focus', '')
    }
  })
  window.addEventListener('focusout', (e) => {
    forEach(document.querySelectorAll('[keyboard-focus]'), (element) => {
      element.removeAttribute('keyboard-focus')
    })
  })

  // Create map on button press
  button.addEventListener('click', (e) => {
    // Advance history
    const data = { v: mapId, isBack: true }
    const title = options.title // document.title
    let uri = window.location.href
    uri = addOrUpdateParameter(uri, 'v', mapId)
    // Add any querystring parameters from constructor
    if (options.layers) { uri = addOrUpdateParameter(uri, 'lyr', options.layers) }
    if (options.extent) { uri = addOrUpdateParameter(uri, 'ext', options.extent) }
    if (options.selectedId) { uri = addOrUpdateParameter(uri, 'fid', options.selectedId) }
    window.history.pushState(data, title, uri)
    options.isBack = true
    return new LiveMap(mapId, options)
  })

  // Recreate map on browser history change
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.v === mapId) {
      options.isBack = window.history.state.isBack
      return new LiveMap(e.state.v, options)
    }
  })

  // Recreate map on page refresh
  if (window.flood.utils.getParameterByName('v') === mapId) {
    options.isBack = window.history.state.isBack
    return new LiveMap(mapId, options)
  }
}
