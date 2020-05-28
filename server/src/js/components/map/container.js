'use strict'
// This file represents the map container.
// It is responsible for initialising the map
// using the ol.view, layers and other options passed.
// It also controls the zoom, full screen controls, responsiveness etc.
// No implementation details specific to a map should be in here.
// This is a generic container that could be reused for LTFRI maps, FMfP etc.
// ***To include a key, include an element with `.map-key__container` in the main inner element.
// To include a key pass its template name as an option

// DL: Includes body-scroll-lock package.

import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import { defaults as defaultControls, Zoom, Control } from 'ol/control'
import { Map } from 'ol'

const { addOrUpdateParameter, forEach } = window.flood.utils
const maps = window.flood.maps

window.flood.maps.MapContainer = function MapContainer (mapId, options) {
  // Setup defaults
  const defaults = {
    minIconResolution: window.flood.maps.minResolution,
    keyTemplate: '',
    controls: []
  }
  options = Object.assign({}, defaults, options)

  // State object
  const state = {
    isKeyOpen: false,
    isInfoOpen: false,
    isTooltipOpen: false,
    isMobile: false,
    isTablet: false,
    isBack: options.isBack
  }

  // Disable body scrolling and hide non-map elements
  document.title = `Map view: ${document.title}`
  document.body.classList.add('defra-map-body')

  // Create the map container element
  const containerElement = document.createElement('div')
  containerElement.id = mapId
  containerElement.className = 'defra-map'
  containerElement.setAttribute('role', 'dialog')
  containerElement.setAttribute('open', true)
  containerElement.setAttribute('aria-modal', true)
  containerElement.setAttribute('aria-label', 'Map view')
  containerElement.tabIndex = 0
  document.body.appendChild(containerElement)

  // Create the dialog heading
  const headingElement = document.createElement('h1')
  headingElement.className = 'defra-map__title'
  headingElement.innerText = options.headingText || 'Map view'
  containerElement.appendChild(headingElement)

  // Remove default controls
  const controls = defaultControls({
    zoom: false,
    rotate: false,
    attribution: false
  })

  // Render map
  const map = new Map({
    target: containerElement,
    layers: options.layers,
    view: options.view,
    controls: controls,
    interactions: options.interactions
  })

  // Get reference to viewport
  const viewport = containerElement.getElementsByClassName('ol-viewport')[0]
  viewport.id = 'viewport'
  viewport.setAttribute('role', 'region')
  viewport.className = `defra-map-viewport ${viewport.className}`

  // Create exit map button
  const exitMapButtonElement = document.createElement('button')
  exitMapButtonElement.className = 'defra-map__' + (state.isBack ? 'back' : 'exit')
  exitMapButtonElement.appendChild(document.createTextNode('Exit map'))
  const exitMapButton = new Control({
    element: exitMapButtonElement
  })
  map.addControl(exitMapButton)

  // Create open key button
  const openKeyButtonElement = document.createElement('button')
  openKeyButtonElement.className = 'defra-map__open-key'
  openKeyButtonElement.innerHTML = 'Key'
  const openKeyButton = new Control({
    element: openKeyButtonElement
  })
  map.addControl(openKeyButton)

  // Create viewport keyboard access tooltip
  const tooltipElement = document.createElement('div')
  tooltipElement.className = 'defra-map-tooltip'
  tooltipElement.id = 'tooltip'
  tooltipElement.setAttribute('role', 'tooltip')
  tooltipElement.hidden = true
  tooltipElement.innerHTML = 'Keyboard access guidelines'
  viewport.appendChild(tooltipElement)

  // Add any custom controls bewteen open key and reset buttons
  options.controls.forEach(control => {
    map.addControl(control)
  })

  // Create reset control
  const resetButtonElement = document.createElement('button')
  resetButtonElement.className = 'defra-map-reset'
  resetButtonElement.innerHTML = 'Reset location'
  resetButtonElement.title = 'Reset location'
  resetButtonElement.setAttribute('disabled', '')
  const resetButton = new Control({
    element: resetButtonElement
  })
  map.addControl(resetButton)

  // Create zoom controls
  const zoom = new Zoom({
    className: 'defra-map-zoom'
  })
  map.addControl(zoom)

  // Create feature information panel
  const infoElement = document.createElement('div')
  infoElement.className = 'defra-map-info'
  infoElement.id = 'info'
  infoElement.setAttribute('role', 'dialog')
  infoElement.setAttribute('open', false)
  infoElement.setAttribute('aria-modal', false)
  infoElement.setAttribute('aria-label', 'Feature information')
  infoElement.tabIndex = 0
  const closeInfoButton = document.createElement('button')
  closeInfoButton.className = 'defra-map-info__close'
  closeInfoButton.innerHTML = 'Close'
  const infoContainer = document.createElement('div')
  infoContainer.className = 'defra-map-info__container'
  infoElement.appendChild(closeInfoButton)
  infoElement.appendChild(infoContainer)
  containerElement.appendChild(infoElement)

  // Create key
  const keyElement = document.createElement('div')
  keyElement.className = 'defra-map-key'
  keyElement.id = 'key'
  keyElement.setAttribute('aria-labelledby', 'mapKeyLabel')
  keyElement.tabIndex = 0
  const keyTitle = document.createElement('span')
  keyTitle.id = 'mapKeyLabel'
  keyTitle.className = 'defra-map-key__title'
  keyTitle.innerHTML = 'Key'
  keyElement.appendChild(keyTitle)
  const closeKeyButton = document.createElement('button')
  closeKeyButton.className = 'defra-map-key__close'
  closeKeyButton.innerHTML = 'Close key'
  keyElement.appendChild(closeKeyButton)
  const keyContainer = document.createElement('div')
  keyContainer.className = 'defra-map-key__container'
  keyContainer.innerHTML = window.nunjucks.render(options.keyTemplate)
  keyElement.appendChild(keyContainer)
  containerElement.appendChild(keyElement)

  // Start focus (will be removed if not keyboard)
  containerElement.focus()
  if (!containerElement.hasAttribute('keyboard-focus')) {
    containerElement.removeAttribute('tabindex') // Address Safari && iOS performance issue
  }

  //
  // Private methods
  //

  const exitMap = () => {
    if (state.isBack) {
      // Browser back
      window.history.back()
    } else {
      // Remove url parameters
      let uri = window.location.href
      options.queryParamKeys.forEach(key => {
        uri = addOrUpdateParameter(uri, key, '')
      })
      // Reset history
      const data = { v: '', isBack: false }
      const title = document.title.replace('Map view: ', '')
      window.history.replaceState(data, title, uri)
      // Reset document
      removeContainer()
    }
  }

  const removeContainer = () => {
    if (containerElement) { // Safari fires popstate on page load
      const title = document.title.replace('Map view: ', '')
      // Reinstate document properties
      document.title = title
      // Unlock body scroll
      document.body.classList.remove('defra-map-body')
      clearAllBodyScrollLocks()
      // Remove map and return focus
      containerElement.parentNode.removeChild(containerElement)
      const button = document.getElementById(mapId + '-btn')
      button.focus()
      // Tidy up any document or window listeners
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('popstate', popstate)
    }
  }

  const openKey = () => {
    state.isKeyOpen = true
    containerElement.classList.add('defra-map--key-open')
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    closeInfo()
    keyElement.focus()
    if (!maps.isKeyboard) {
      containerElement.removeAttribute('tabindex')
    }
    // Lock body scroll
    disableBodyScroll(document.querySelector('.defra-map-key__container'))
  }

  const closeKey = () => {
    state.isKeyOpen = !state.isTablet
    containerElement.classList.remove('defra-map--key-open')
    keyElement.setAttribute('open', state.isKeyOpen)
    keyElement.setAttribute('aria-modal', state.isTablet)
    openKeyButton.element.focus()
  }

  const closeInfo = () => {
    state.isInfoOpen = false
    infoElement.classList.remove('defra-map-info--open')
    infoElement.setAttribute('open', false)
    infoContainer.innerHTML = ''
    containerElement.focus()
  }

  const hideTooltip = () => {
    state.isTooltipOpen = false
    tooltipElement.hidden = true
  }

  //
  // Public properties
  //

  this.map = map
  this.containerElement = containerElement
  this.viewport = viewport
  this.keyElement = keyElement
  this.resetButton = resetButtonElement
  this.openKeyButton = openKeyButton.element
  this.closeInfoButton = closeInfoButton
  this.state = state

  //
  // Public methods
  //

  this.showInfo = (feature) => {
    state.isInfoOpen = true
    infoElement.classList.add('defra-map-info--open')
    infoElement.setAttribute('open', true)
    infoContainer.innerHTML = feature.get('html')
    infoElement.focus()
    if (!maps.isKeyboard) {
      containerElement.removeAttribute('tabindex')
    }
  }

  this.showTooltip = () => {
    state.isTooltipOpen = true
    tooltipElement.hidden = false
  }

  //
  // Events
  //

  // Mobile behavior
  const mobileMediaQuery = window.matchMedia('(max-width: 40.0525em)')
  const zoomButtons = document.querySelectorAll('.defra-map-zoom button')
  const mobileListener = (mobileMediaQuery) => {
    state.isMobile = mobileMediaQuery.matches
    forEach(zoomButtons, (button) => {
      button.hidden = state.isMobile
    })
  }
  mobileMediaQuery.addListener(mobileListener)
  mobileListener(mobileMediaQuery)

  // Tablet (upto portrait) behavior
  const tabletMediaQuery = window.matchMedia('(max-width: 48.0625em)')
  const tabletListener = (tabletMediaQuery) => {
    state.isTablet = tabletMediaQuery.matches
    state.isKeyOpen = (containerElement.classList.contains('defra-map--key-open') && state.isTablet) || !state.isTablet
    keyElement.setAttribute('role', state.isTablet ? 'dialog' : 'region')
    closeKeyButton.hidden = !state.isTablet
    openKeyButton.hidden = !state.isTablet
    if (state.isTablet) {
      keyElement.setAttribute('open', state.isKeyOpen)
      keyElement.setAttribute('aria-modal', true)
    } else {
      keyElement.removeAttribute('open')
      keyElement.removeAttribute('aria-modal')
    }
    // Remove tabindex if keyboard and key is open
    if (containerElement.hasAttribute('tabindex')) {
      containerElement.tabIndex = state.isTablet && state.isKeyOpen ? -1 : 0
    }
  }
  tabletMediaQuery.addListener(tabletListener)
  tabletListener(tabletMediaQuery)

  // Map click
  map.on('click', (e) => {
    // Hide key
    if (state.isTablet && state.isKeyOpen) {
      closeKey()
    }
    // Close info panel
    if (state.isInfoOpen) {
      closeInfo()
    }
    containerElement.focus()
  })

  // Exit map click
  exitMapButton.element.addEventListener('click', (e) => {
    exitMap()
  })

  // Open key click
  openKeyButton.element.addEventListener('click', (e) => {
    openKey()
  })

  // Close key click
  closeKeyButton.addEventListener('click', (e) => {
    closeKey()
  })

  // Close info click
  closeInfoButton.addEventListener('click', (e) => {
    closeInfo()
  })

  // Mouse or touch interaction
  containerElement.addEventListener('pointerdown', (e) => {
    infoElement.blur()
    keyElement.blur()
    containerElement.removeAttribute('tabindex') // Performance issue in Safari
    containerElement.removeAttribute('keyboard-focus')
  })

  // Disable pinch and double tap zoom
  containerElement.addEventListener('gesturestart', function (e) {
    e.preventDefault()
    document.body.style.zoom = 0.99 // Disable Safari zoom-to-tabs gesture
  })
  containerElement.addEventListener('gesturechange', function (e) {
    e.preventDefault()
    document.body.style.zoom = 0.99 // Disable Safari zoom-to-tabs gesture
  })
  containerElement.addEventListener('gestureend', function (e) {
    e.preventDefault()
    document.body.style.zoom = 0.99 // Disable Safari zoom-to-tabs gesture
  })

  // Firt tab key and tabrings
  const keydown = (e) => {
    if (e.key !== 'Tab') { return }
    // Set appropriate tabindex on container
    containerElement.tabIndex = 0
    tabletListener(tabletMediaQuery)
    // Reset focus to container
    if (document.activeElement === document.body || (document.activeElement === containerElement && !containerElement.hasAttribute('keyboard-focus'))) {
      e.preventDefault()
      containerElement.focus()
      containerElement.setAttribute('keyboard-focus', '')
    }
    // Constrain tab focus within dialog
    const tabring = document.activeElement.closest('[role="dialog"]') || containerElement
    const specificity = tabring.classList.contains('defra-map') ? '[role="region"] ' : ''
    const selectors = [
      'a[href]:not([disabled]):not([hidden])',
      'button:not([disabled]):not([hidden])',
      'textarea:not([disabled]):not([hidden])',
      'input[type="text"]:not([disabled]):not([hidden])',
      'input[type="radio"]:not([disabled]):not([hidden])',
      'input[type="checkbox"]:not([disabled]):not([hidden])',
      'select:not([disabled]):not([hidden])'
    ]
    const focusableEls = document.querySelectorAll(`#${tabring.id}, ` + selectors.map(i => `#${tabring.id} ${specificity}` + i).join(','))
    const firstFocusableEl = focusableEls[0]
    const lastFocusableEl = focusableEls[focusableEls.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus()
        e.preventDefault()
      }
    }
  }
  window.addEventListener('keydown', keydown)

  // All keypress (keyup) events
  const keyup = (e) => {
    // Escape key behavior
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (state.isTooltipOpen) {
        hideTooltip()
      } else if (state.isInfoOpen) {
        closeInfoButton.click()
      } else if (state.isTablet && state.isKeyOpen) {
        closeKeyButton.click()
      } else {
        exitMapButtonElement.click()
      }
    }
    // Move tab ring between regions
    if (e.key === 'F6') {
      if (e.shiftKey) /* shift + F6 */ {
        console.log('Previous region')
      } else /* F6 */ {
        console.log('Next region')
      }
    }
  }
  window.addEventListener('keyup', keyup)

  // Remove map on popsate change
  const popstate = (e) => {
    removeContainer()
  }
  window.addEventListener('popstate', popstate)
}
