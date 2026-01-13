'use strict'
// This file represents the 5 day outlook used on the national page.
import { View, Overlay } from 'ol'
import { defaults as defaultInteractions } from 'ol/interaction'
import { transform } from 'ol/proj'
import { Point } from 'ol/geom'
import { getCenter } from 'ol/extent'
import { unByKey } from 'ol/Observable'
import { Control } from 'ol/control'
import { createMapButton } from './button'

const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const maps = window.flood.maps
const { setExtentFromLonLat, getLonLatFromExtent } = window.flood.maps
const MapContainer = maps.MapContainer

function OutlookMap (mapId, options) {
  // State
  const state = {
    selectedFeatureId: -1,
    visibleRiskLevels: [1, 2, 3, 4],
    day: 1
  }

  // View
  const view = new View({
    zoom: 6,
    minZoom: 6,
    maxZoom: 9,
    center: maps.center,
    extent: maps.extentLarge
  })

  // Layers
  const topography = maps.layers.topography()
  const areasOfConcern = maps.layers.areasOfConcern()
  const places = maps.layers.places()

  // Configure default interactions
  const interactions = defaultInteractions({
    pinchRotate: false
  })

  // Format day today or Monday, Tuesday etc
  const formatDay = (date) => {
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0, 0)
    const now = new Date()
    now.setHours(0)
    now.setMinutes(0)
    now.setSeconds(0, 0)
    if (date.getTime() === now.getTime()) {
      return 'Today'
    } else {
      return date.toLocaleString('en-GB', { weekday: 'short' })
    }
  }

  // Format date e.g. '12 Nov'
  const formatDate = (date) => {
    const number = date.getDate()
    const month = date.toLocaleString('en-GB', { month: 'short' })
    return `${number} ${month}`
  }

  // Create day control
  const dayControlsElement = document.createElement('div')
  dayControlsElement.id = 'map-days'
  const dayControlsContainer = document.createElement('div')
  dayControlsElement.className = 'defra-map-days'
  dayControlsContainer.className = 'defra-map-days__container'
  options.days.forEach(function (day) {
    const dayButtonElement = document.createElement('button')
    dayButtonElement.className = 'defra-map-days__button'
    dayButtonElement.setAttribute('data-risk-level', day.level)
    dayButtonElement.setAttribute('data-day', day.idx)
    dayButtonElement.setAttribute('aria-selected', false)
    const dayName = formatDay(new Date(day.date))
    const date = formatDate(new Date(day.date))
    const dayButtonContainer = document.createElement('div')
    dayButtonContainer.className = 'defra-map-days__button-container'
    dayButtonContainer.innerHTML = `<strong>${dayName}</strong><br/>${date}<span class="defra-map-days__icon defra-map-days__icon--risk-level-${day.level}"></span>`
    dayButtonElement.appendChild(dayButtonContainer)
    dayControlsContainer.appendChild(dayButtonElement)
    // Set state day to current day
    if (dayName.toLowerCase() === 'today') {
      state.day = day.idx
    }
  })
  dayControlsElement.appendChild(dayControlsContainer)
  const dayControl = new Control({
    element: dayControlsElement
  })

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    view,
    layers: [topography, areasOfConcern, places],
    controls: [dayControl],
    queryParamKeys: ['v'],
    interactions,
    originalTitle: options.originalTitle,
    title: options.title,
    heading: options.heading,
    keyTemplate: 'key-outlook.html',
    isBack: options.isBack
  }

  // Create MapContainer
  const container = new MapContainer(mapId, containerOptions)
  const containerElement = container.containerElement
  const closeInfoButton = container.closeInfoButton
  const openKeyButton = container.openKeyButton
  const closeKeyButton = container.closeKeyButton
  const attributionButton = container.attributionButton
  const viewport = container.viewport
  const viewportDescription = container.viewportDescription
  const keyElement = container.keyElement
  const map = container.map

  // Create a separate live region for selection announcements
  const selectionAnnouncer = document.createElement('div')
  selectionAnnouncer.className = 'govuk-visually-hidden'
  selectionAnnouncer.setAttribute('aria-live', 'assertive')
  selectionAnnouncer.setAttribute('aria-atomic', 'true')
  containerElement.appendChild(selectionAnnouncer)

  //
  // Private methods
  //

  // Get features visible in the current viewport
  const getVisibleFeatures = () => {
    const features = []
    const extent = map.getView().calculateExtent(map.getSize())
    areasOfConcern.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
      if (!feature.get('isVisible')) { return false }
      let labelPosition = getCenter(feature.getGeometry().getExtent())
      if (feature.get('labelPosition').length) {
        labelPosition = new Point(transform(feature.get('labelPosition'), 'EPSG:4326', 'EPSG:3857')).getCoordinates()
      }
      const riskLevel = parseInt(feature.get('risk-level'), 10)
      const riskLabels = { 1: 'Very low risk', 2: 'Low risk', 3: 'Medium risk', 4: 'High risk' }
      features.push({
        id: feature.getId(),
        centre: labelPosition,
        name: feature.get('name'),
        riskLevel: riskLabels[riskLevel] || 'Unknown risk'
      })
    })
    return features
  }

  // Show overlays
  const showOverlays = () => {
    state.visibleFeatures = getVisibleFeatures()
    const numFeatures = state.visibleFeatures.length
    const features = state.visibleFeatures.slice(0, 9)
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
            featureName: feature.name,
            element: overlayElement,
            position: feature.centre,
            className: `defra-key-symbol defra-key-symbol--${feature.state}${feature.isBigZoom ? '-bigZoom' : ''} ${selected}`,
            offset: [0, 0]
          })
        )
      })
    }
    const model = {
      numFeatures,
      features
    }
    const html = window.nunjucks.render('description-outlook.html', { model })
    viewportDescription.innerHTML = html
  }

  // Set selected feature
  const setSelectedFeature = (newFeatureId = '') => {
    const originalFeature = areasOfConcern.getSource().getFeatureById(state.selectedFeatureId)
    const newFeature = areasOfConcern.getSource().getFeatureById(newFeatureId)
    if (originalFeature) {
      originalFeature.set('isSelected', false)
    }
    if (newFeature) {
      newFeature.set('isSelected', true)
      setFeatureHtml(newFeature)
      // Announce selection to screen readers
      const riskLevel = parseInt(newFeature.get('risk-level'), 10)
      const riskLabels = { 1: 'Very low risk', 2: 'Low risk', 3: 'Medium risk', 4: 'High risk' }
      const riskText = riskLabels[riskLevel] || 'Unknown risk'
      // Clear first to force re-announcement even if same text
      selectionAnnouncer.textContent = ''
      setTimeout(() => {
        selectionAnnouncer.textContent = `Selected: ${newFeature.get('name')}, ${riskText} area`
      }, 10)
    } else {
      showDays()
      selectionAnnouncer.textContent = ''
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
    state.selectedFeatureId = newFeatureId
  }

  // Hide overlays
  const hideOverlays = () => {
    state.hasOverlays = false
    map.getOverlays().clear()
  }

  // Set feature overlay html
  const setFeatureHtml = (feature) => {
    const model = feature.getProperties()
    model.id = feature.getId()
    const html = window.nunjucks.render('info-outlook.html', { model })
    feature.set('html', html)
  }

  // Set feature visiblity
  const setFeatureVisibility = () => {
    areasOfConcern.getSource().forEachFeature((feature) => {
      const riskLevel = parseInt(feature.get('risk-level'), 10)
      const hasDay = feature.get('days').includes(state.day)
      const isVisible = state.visibleRiskLevels.includes(riskLevel) && hasDay
      feature.set('isVisible', isVisible)
    })
  }

  // Set day control current day
  const setDaysButton = () => {
    forEach(document.querySelectorAll('.defra-map-days__button'), (button, i) => {
      button.setAttribute('aria-selected', i + 1 === state.day)
    })
  }

  // Hide day control
  const hideDays = () => {
    dayControlsElement.style.display = 'none'
    dayControlsElement.setAttribute('open', false)
    dayControlsElement.removeAttribute('aria-modal')
    dayControlsElement.setAttribute('aria-hidden', true)
  }

  // Show day control
  const showDays = () => {
    dayControlsElement.style.display = 'block'
    dayControlsElement.setAttribute('open', true)
    dayControlsElement.setAttribute('aria-modal', true)
    dayControlsElement.removeAttribute('aria-hidden')
  }

  //
  // Setup
  //

  // Define map extent
  let extent
  if (getParameterByName('ext')) {
    extent = getParameterByName('ext').split(',').map(Number)
  } else {
    extent = getLonLatFromExtent(maps.extent)
  }

  // Set map viewport
  setExtentFromLonLat(map, extent)

  // Show layers
  topography.setVisible(true)

  // Set start day
  if (options.startDay) {
    state.day = options.startDay
  }

  // Centre map on bbox
  if (options.bbox && options.bbox.length) {
    maps.setExtentFromLonLat(map, options.bbox)
  }

  //
  // Events
  //

  // Set first day when features have loaded
  const change = areasOfConcern.getSource().on('change', (e) => {
    if (e.target.getState() === 'ready') {
      unByKey(change) // Remove ready event when layer is ready
      setFeatureVisibility()
      setDaysButton()
    }
  })

  // Clear viewport description to force screen reader to re-read
  let timer = null
  map.addEventListener('moveend', (e) => {
    viewportDescription.innerHTML = ''
    viewportDescription.setAttribute('aria-busy', 'true')
    // Timer used to control screen reader pace
    clearTimeout(timer)
    // Tasks dependent on a time delay
    timer = setTimeout(() => {
      // Show overlays for visible features
      showOverlays()
      viewportDescription.removeAttribute('aria-busy')
    }, 350)
  })

  // Show cursor when hovering over features
  map.addEventListener('pointermove', (e) => {
    // Detect vector feature at mouse coords
    const hit = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (layer === areasOfConcern) { return true }
    })
    map.getTarget().style.cursor = hit ? 'pointer' : ''
  })

  // Set selected feature if map is clicked
  // Clear overlays if non-keyboard interaction
  map.addEventListener('click', (e) => {
    // Hide overlays if non-keyboard interaction
    if (!maps.isKeyboard) { hideOverlays() }
    // Get mouse coordinates and check for feature
    const featureId = map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      if (layer === areasOfConcern) {
        const id = feature.getId()
        return id
      }
    })
    setSelectedFeature(featureId)
  })

  // Show overlays on first tab in from browser controls
  viewport.addEventListener('focus', (e) => {
    if (maps.isKeyboard) { showOverlays() }
  })

  // Handle all Outlook Map specific key presses
  containerElement.addEventListener('keyup', (e) => {
    // Check if it's a number key for selection first
    const isNumberKey = !isNaN(e.key) && e.key >= 1 && e.key <= 9
    
    // Re-instate days when key has been closed
    if (e.key === 'Escape') {
      showDays()
    }
    // Show overlays when any key is pressed other than Escape or number keys
    if (e.key !== 'Escape' && !isNumberKey) {
      showOverlays()
    }
    // Clear selected feature when pressing escape
    if (e.key === 'Escape' && state.selectedFeatureId !== '') {
      setSelectedFeature()
    }
    // Set selected feature on [1-9] key press
    if (isNumberKey && e.key <= state.visibleFeatures.length && state.visibleFeatures.length <= 9) {
      setSelectedFeature(state.visibleFeatures[e.key - 1].id)
    }
  })

  // Clear selectedfeature when info is closed
  closeInfoButton.addEventListener('click', (e) => {
    setSelectedFeature()
  })

  // Clear selectedfeature and hide days when key is opened
  openKeyButton.addEventListener('click', (e) => {
    setSelectedFeature()
    hideDays()
  })

  // Re-instate days when key has been closed
  closeKeyButton.addEventListener('click', (e) => {
    showDays()
  })

  // Clear selectedfeature and hide days when attribution is opended
  attributionButton.addEventListener('click', (e) => {
    setSelectedFeature()
    hideDays()
  })

  // Day control button
  forEach(document.querySelectorAll('.defra-map-days__button'), (button) => {
    button.addEventListener('click', (e) => {
      e.currentTarget.focus()
      if (!maps.isKeyboard) { hideOverlays() }
      state.day = parseInt(e.currentTarget.getAttribute('data-day'), 10)
      setFeatureVisibility()
      setDaysButton()
    })
  })

  // Key checkbox click
  keyElement.addEventListener('click', (e) => {
    if (e.target.nodeName === 'INPUT') {
      state.visibleRiskLevels = [...keyElement.querySelectorAll('input:checked')].map(e => parseInt(e.getAttribute('data-risk-level'), 10))
      setFeatureVisibility()
    }
  })
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createOutlookMap = (mapId, options = {}) => {
  // Set meta title and page heading
  options.originalTitle = document.title
  options.heading = 'Flood outlook map'
  options.title = options.heading + ' - Check for flooding - GOV.UK' // `Map view: ${document.title}`

  // Set initial history state
  if (!window.history.state) {
    const data = {}
    const title = options.title
    const uri = window.location.href
    window.history.replaceState(data, title, uri)
  }

  // Build default uri
  let uri = window.location.href
  uri = addOrUpdateParameter(uri, 'v', mapId)

  const btnContainer = document.getElementById(mapId)
  const button = createMapButton(btnContainer, uri, options)
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

  // Manage scroll position
  if (!maps.hasScrollListener) {
    window.addEventListener('scroll', () => {
      document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`)
    })
    maps.hasScrollListener = true
  }

  // Create map on button press
  button.addEventListener('click', (e) => {
    // Advance history
    const data = { v: mapId, isBack: true }
    const title = options.title
    let uri = window.location.href
    uri = addOrUpdateParameter(uri, 'v', mapId)
    window.history.pushState(data, title, uri)
    options.isBack = true
    return new OutlookMap(mapId, options)
  })

  // Recreate map on browser history change
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.v === mapId) {
      options.isBack = window.history.state.isBack
      return new OutlookMap(e.state.v, options)
    }
  })

  // Recreate map on page refresh
  if (window.flood.utils.getParameterByName('v') === mapId) {
    options.isBack = window.history.state.isBack
    return new OutlookMap(mapId, options)
  }
}
