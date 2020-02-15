'use strict'
// This file represents the map container.
// It is responsible for initialising the map
// using the ol.view, layers and other options passed.
// It also controls the zoom, full screen controls, responsiveness etc.
// No implementation details specific to a map should be in here.
// This is a generic container that could be reused for LTFRI maps, FMfP etc.
// ***To include a key, include an element with `.map-key__container` in the main inner element.
// To include a key pass its template name as an option

import { defaults as defaultControls, Zoom } from 'ol/control'
import { Map, Overlay } from 'ol'
import { defaults as defaultInteractions, KeyboardPan } from 'ol/interaction'

const { addOrUpdateParameter, getParameterByName } = window.flood.utils

window.flood.maps.MapContainer = function MapContainer (containerElement, options) {
  const defaults = {
    minIconResolution: window.flood.maps.minResolution,
    keyTemplate: ''
  }

  options = Object.assign({}, defaults, options)

  // Container internal properties
  let isKeyOpen = false

  // Create DOM elements
  const mapElement = document.createElement('div')
  mapElement.className = 'defra-map__container'
  containerElement.appendChild(mapElement)

  let keyToggleElement, keyElement, keyHtml

  // Create key
  if (options.keyTemplate !== '') {
    keyElement = document.createElement('div')
    keyHtml = window.nunjucks.render(options.keyTemplate)
    keyElement.innerHTML = keyHtml
    keyElement.className = 'map-key'
    // Create key toggle button
    keyToggleElement = document.createElement('button')
    keyToggleElement.innerHTML = 'Show key'
    keyToggleElement.title = 'Add or remove information from the map'
    keyToggleElement.className = 'defra-map-key__toggle-key-btn'
    keyToggleElement.addEventListener('click', function (e) {
      e.preventDefault()
      isKeyOpen ? closeKey() : openKey()
    })
    mapElement.classList.add('map--has-key')
    mapElement.appendChild(keyElement)
    keyElement.insertBefore(keyToggleElement, keyElement.firstChild)
  }

  // Create overlay
  const overlayInnerElement = document.createElement('div')
  overlayInnerElement.classList.add('ol-overlay-inner')

  // Close overlay button
  const closeOverlayButton = document.createElement('button')
  closeOverlayButton.appendChild(document.createTextNode('Close'))
  closeOverlayButton.className = 'ol-close-overlay'
  closeOverlayButton.addEventListener('click', function (e) {
    this.hideOverlay()
  }.bind(this))

  // Create zoom buttons
  const zoomButton = document.createElement('button')
  zoomButton.appendChild(document.createTextNode('Zoom'))
  zoomButton.className = 'ol-zoom'
  const zoom = new Zoom({
    element: zoomButton
  })

  // Create exit map button
  const hideMapButton = document.createElement('button')
  hideMapButton.className = 'defra-map__exit-map-btn'
  hideMapButton.appendChild(document.createTextNode('Exit map'))
  hideMapButton.addEventListener('click', function (e) {
    hideMap()
  })

  // ie 11 prepend hack
  // mapElement.prepend(hideMapButton)
  mapElement.insertBefore(hideMapButton, mapElement.childNodes[0])
  // Move focus to exit map button
  hideMapButton.focus()

  // Controls - could be moved to instance
  const controls = defaultControls({
    zoom: false,
    rotate: false,
    attribution: false
  }).extend([zoom])

  // Render map
  const map = new Map({
    target: mapElement,
    controls: controls,
    layers: options.layers,
    view: options.view,
    interactions: defaultInteractions({
      altShiftDragRotate: false,
      pinchRotate: false
    })
  })

  // Create a new history entry if show map button pressed
  if (!(getParameterByName('v') === containerElement.id)) {
    // Advance history if button pressed
    const state = { v: containerElement.id }
    const title = document.title
    let url = window.location.pathname + window.location.search
    url = addOrUpdateParameter(url, 'v', containerElement.id)
    if (options.display) {
      // Add any querystring parameters that may have been passed in
      Object.keys(options.display).forEach(function (key, index) {
        url = addOrUpdateParameter(url, key, options.display[key])
      })
    }
    window.history.pushState(state, title, url)
  }

  //
  // Container internal methods
  //

  // Open key
  const openKey = () => {
    mapElement.classList.add('map--key-open')
    keyToggleElement.innerHTML = 'Close'
    isKeyOpen = true
  }

  // Close key
  const closeKey = () => {
    mapElement.classList.remove('map--key-open')
    keyToggleElement.innerHTML = 'Show key'
    isKeyOpen = false
  }

  const hideMap = () => {
    // Return focus to original map button
    if (getParameterByName('btn')) {
      const btn = document.getElementById(getParameterByName('btn'))
      btn.focus()
    }
    if (!options.display['no-back']) {
      window.history.back()
    } else {
      window.location.href = window.location.pathname + (getParameterByName('q') ? '?q=' + getParameterByName('q') : '')
    }
  }

  //
  // Container external methods
  //

  // Show overlay
  this.showOverlay = function (feature) {
    // Store selected feature
    // this.selectedFeature = feature
    // Add class to map
    mapElement.classList.add('map--overlay-open')
    // Add feature html
    overlayInnerElement.innerHTML = feature.get('html')

    // Create overlay object
    this.overlay = new Overlay({
      element: overlayInnerElement,
      positioning: 'bottom-left',
      insertFirst: false,
      className: 'ol-overlay'
    })

    this.overlay.element.style.display = 'block'
    map.addOverlay(this.overlay)
    overlayInnerElement.parentNode.insertBefore(closeOverlayButton, overlayInnerElement)
  }

  // Hide overlay
  this.hideOverlay = function () {
    // Add class to map
    mapElement.classList.remove('map--overlay-open')
    // Disable last selected feature
    /*
    if (this.selectedFeature) {
      // Target areas have two point and polygon on different layers
      this.selectedFeature.set('isSelected', false)
      this.selectedFeature = null
    }
    */
    // Remove overlay object
    if (this.overlay) {
      map.removeOverlay(this.overlay)
    }
  }

  //
  // Container events
  //

  // Close key or overlay if map is clicked
  map.on('click', function (e) {
    // Hide overlay if exists
    this.hideOverlay()
    if (isKeyOpen) {
      closeKey()
    }
    // Set a short timeout to allow downstream events to fire
    // and set `e.hit`. Hide the key when nothing is clicked (hit).
    /*
    setTimeout(function () {
      if (isKeyOpen) {
        this.closeKey()
      }
    }.bind(this), 100)
    */

    // Disable mouse wheel when point moves away from the map
    /*
    containerElement.addEventListener('mouseout', function (e) {
      mouseWheelZoom.setActive(false)
    })
    */
  }.bind(this))

  // Constrain keyboard focus to components of the map
  mapElement.addEventListener('keydown', function (e) {
    if (mapElement.contains(document.activeElement)) {
      // Tab key
      if (e.keyCode === 9) {
        // Select only elements that can have focus
        const focusableElements = mapElement.querySelectorAll('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        // Filter to remove any elements that are not currently visible
        const validElements = []
        for (let i = 0; i < focusableElements.length; i++) {
          if (focusableElements[i].offsetParent !== null) {
            validElements.push(focusableElements[i])
          }
        }
        // Set first and last focusable elements
        const firstFocusableElement = validElements[0]
        const lastFocusableElement = validElements[validElements.length - 1]
        // Shift tab (backwards)
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            e.preventDefault()
            lastFocusableElement.focus()
          }
        } else { // Tab (forwards)
          if (document.activeElement === lastFocusableElement) {
            e.preventDefault()
            firstFocusableElement.focus()
          }
        }
      }
      // Add map pan (cursor keys)
      // Add map zoom (plus and minus keys)
    }
  })

  // If radio group is in focus disable openlayers keyboard pan
  let keyboardPan
  let hasKeyboardPan = true
  mapElement.addEventListener('keyup', function (e) {
    if (e.keyCode === 27) {
      return hideMap()
    }
    if (mapElement.contains(document.activeElement)) {
      if (document.activeElement.type === 'radio') {
        map.getInteractions().forEach(function (interaction) {
          if (interaction instanceof KeyboardPan) {
            keyboardPan = interaction
          }
        }, this)
        if (keyboardPan) {
          map.removeInteraction(keyboardPan)
          hasKeyboardPan = false
        }
        map.removeInteraction(keyboardPan)
      } else {
        if (!hasKeyboardPan) {
          map.addInteraction(keyboardPan)
          hasKeyboardPan = true
        }
      }
    }
  })

  //
  // Container external properties
  //

  this.map = map
  this.mapElement = mapElement
  this.keyElement = keyElement
}
