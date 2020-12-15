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
import { defaults as defaultControls, Attribution, Zoom, Control } from 'ol/control'
import { Map } from 'ol'

const { addOrUpdateParameter, forEach } = window.flood.utils

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
    isAttributionsOpen: false,
    isMobile: false,
    isTablet: false,
    isBack: options.isBack
  }

  // Disable body scrolling and hide non-map elements
  document.title = options.title
  document.body.classList.add('defra-map-body')

  // Create the map container element
  const containerElement = document.createElement('div')
  containerElement.id = mapId
  containerElement.className = 'defra-map'
  containerElement.setAttribute('role', 'dialog')
  containerElement.setAttribute('open', true)
  containerElement.setAttribute('aria-modal', true)
  containerElement.setAttribute('aria-labelledby', 'mapLabel')
  document.body.appendChild(containerElement)

  // Create the main dialog heading
  const mapLabel = document.createElement('h1')
  mapLabel.id = 'mapLabel'
  mapLabel.className = 'defra-map__title'
  mapLabel.innerText = options.heading || 'Map view'
  containerElement.appendChild(mapLabel)

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
  viewport.setAttribute('role', 'application')
  viewport.setAttribute('aria-label', 'Interactive map viewer')
  viewport.setAttribute('aria-describedby', 'viewportDescription')
  viewport.setAttribute('aria-live', 'assertive')
  viewport.className = `defra-map-viewport ${viewport.className}`
  viewport.tabIndex = 0

  // Create viewport description container
  const viewportDescription = document.createElement('div')
  viewportDescription.id = 'viewportDescription'
  viewportDescription.className = 'govuk-visually-hidden'
  viewport.appendChild(viewportDescription)

  // Create controls container
  const controlsElement = document.createElement('div')
  controlsElement.className = 'defra-map-controls'
  containerElement.appendChild(controlsElement)

  // Create exit map button
  const exitMapButtonElement = document.createElement('button')
  exitMapButtonElement.className = 'defra-map__' + (state.isBack ? 'back' : 'exit')
  exitMapButtonElement.appendChild(document.createTextNode('Exit map'))
  const exitMapButton = new Control({
    element: exitMapButtonElement,
    target: controlsElement
  })
  map.addControl(exitMapButton)

  // Create the open key button
  const openKeyButtonElement = document.createElement('button')
  openKeyButtonElement.className = 'defra-map__open-key'
  openKeyButtonElement.innerHTML = 'Open key'
  const openKeyButton = new Control({
    element: openKeyButtonElement,
    target: controlsElement
  })
  map.addControl(openKeyButton)

  // Create controls container element
  const controlsContainerElement = document.createElement('div')
  controlsContainerElement.className = 'defra-map-controls__container'
  controlsElement.appendChild(controlsContainerElement)

  // Create reset control
  const resetButtonElement = document.createElement('button')
  resetButtonElement.className = 'defra-map-reset'
  resetButtonElement.innerHTML = 'Reset location'
  resetButtonElement.setAttribute('disabled', '')
  resetButtonElement.setAttribute('aria-controls', 'viewport')
  const resetButton = new Control({
    element: resetButtonElement,
    target: controlsContainerElement
  })
  map.addControl(resetButton)

  // Create zoom controls
  const zoomInElement = document.createElement('span')
  zoomInElement.classList.add('govuk-visually-hidden')
  zoomInElement.innerText = 'Zoom in'
  zoomInElement.setAttribute('aria-controls', 'viewport')
  const zoomOutElement = document.createElement('span')
  zoomOutElement.classList.add('govuk-visually-hidden')
  zoomOutElement.innerText = 'Zoom out'
  zoomOutElement.setAttribute('aria-controls', 'viewport')
  const zoom = new Zoom({
    className: 'defra-map-zoom',
    zoomInLabel: zoomInElement,
    zoomOutLabel: zoomOutElement,
    zoomInTipLabel: '',
    zoomOutTipLabel: '',
    target: controlsContainerElement
  })
  map.addControl(zoom)

  // Create attribution control
  const attributtionButtonElement = document.createElement('button')
  attributtionButtonElement.className = 'defra-map-attribution'
  attributtionButtonElement.innerHTML = '<span class="govuk-visually-hidden">List attributions</span>'
  const attributionButton = new Control({
    element: attributtionButtonElement,
    target: controlsContainerElement
  })
  map.addControl(attributionButton)

  // Create feature information panel
  const infoElement = document.createElement('div')
  infoElement.className = 'defra-map-info'
  infoElement.id = 'info'
  infoElement.setAttribute('role', 'dialog')
  infoElement.setAttribute('open', true)
  infoElement.setAttribute('aria-modal', true) // Technically this should be false
  infoElement.setAttribute('aria-labelledby', 'infoLabel')
  infoElement.setAttribute('aria-describedby', 'infoDescription')
  infoElement.tabIndex = -1
  const infoLabel = document.createElement('h2')
  infoLabel.id = 'infoLabel'
  infoLabel.classList.add('govuk-visually-hidden')
  const closeInfoButton = document.createElement('button')
  closeInfoButton.className = 'defra-map-info__close'
  closeInfoButton.innerHTML = 'Close'
  const infoContainer = document.createElement('div')
  infoContainer.className = 'defra-map-info__container'
  const infoContent = document.createElement('div')
  infoContent.id = 'infoContent'
  infoContent.className = 'defra-map-info__content'
  infoContainer.appendChild(infoContent)
  infoContainer.appendChild(closeInfoButton)
  infoElement.appendChild(infoLabel)
  infoElement.appendChild(infoContainer)

  // Create key
  const keyElement = document.createElement('div')
  keyElement.className = 'defra-map-key'
  keyElement.id = 'key'
  keyElement.setAttribute('aria-labelledby', 'mapKeyLabel')
  keyElement.tabIndex = -1
  const keyContainer = document.createElement('div')
  keyContainer.className = 'defra-map-key__container'
  const keyTitle = document.createElement('h2')
  keyTitle.id = 'mapKeyLabel'
  keyTitle.className = 'defra-map-key__title'
  keyTitle.innerHTML = '<span role="text">Key <span class="govuk-visually-hidden">for map features</span></span>'
  keyContainer.appendChild(keyTitle)
  const closeKeyButton = document.createElement('button')
  closeKeyButton.className = 'defra-map-key__close'
  closeKeyButton.innerHTML = 'Close key'
  keyContainer.appendChild(closeKeyButton)
  const keyContent = document.createElement('div')
  keyContent.className = 'defra-map-key__content'
  keyContent.innerHTML = window.nunjucks.render(options.keyTemplate)
  keyContainer.appendChild(keyContent)
  keyElement.appendChild(keyContainer)
  containerElement.appendChild(keyElement)

  // Add any custom controls into the controls container after the info panel
  options.controls.forEach(control => {
    control.setTarget(controlsContainerElement)
    map.addControl(control)
  })

  // Hide all map siblings from screen readers
  const mapSiblings = document.querySelectorAll('body > *:not(.defra-map):not(script):not([aria-hidden="true"])')
  forEach(mapSiblings, (mapSibling) => { mapSibling.setAttribute('aria-hidden', 'true') })

  // Move focus to first interactive element inside the dialog
  viewport.focus()

  //
  // Private methods
  //

  const hideSiblings = (isHidden) => {
    const siblings = document.querySelectorAll(`#${mapId} > *:not(#info):not(#key)`)
    forEach(siblings, (sibling) => { sibling.setAttribute('aria-hidden', isHidden) })
  }

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
      // Reinstate document properties
      document.title = options.originalTitle
      // Unlock body scroll
      document.body.classList.remove('defra-map-body')
      clearAllBodyScrollLocks()
      // Remove map and return focus
      containerElement.parentNode.removeChild(containerElement)
      const button = document.getElementById(mapId + '-btn')
      button.focus()
      // Re-instate aria-hidden elements
      forEach(mapSiblings, (mapSibling) => {
        mapSibling.removeAttribute('aria-hidden')
      })
      // Tidy up any document or window listeners
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('popstate', popstate)
    }
  }

  const openKey = () => {
    // Close info if its currently open
    if (state.isInfoOpen) { closeInfo() }
    // Prevent screen reader from accessing siblings
    hideSiblings(true)
    state.isKeyOpen = true
    containerElement.classList.add('defra-map--key-open')
    keyElement.style.display = 'block' // Safari v14 bug
    keyElement.setAttribute('open', true)
    keyElement.setAttribute('aria-modal', true)
    keyElement.setAttribute('aria-hidden', false)
    keyElement.focus()
    // Lock body scroll
    disableBodyScroll(document.querySelector('.defra-map-key__content'))
  }

  const closeKey = () => {
    state.isKeyOpen = false
    containerElement.classList.remove('defra-map--key-open')
    if (state.isTablet) {
      keyElement.setAttribute('open', false)
      keyElement.setAttribute('aria-modal', true)
      keyElement.style.display = 'none' // Safari v14 bug
    }
    keyElement.setAttribute('aria-hidden', state.isTablet)
    hideSiblings(false)
    openKeyButtonElement.focus()
  }

  const closeInfo = () => {
    // Re-enable screen reader announcement of viewport changes
    viewport.setAttribute('aria-live', 'assertive')
    state.isInfoOpen = false
    infoElement.parentNode.removeChild(infoElement)
    containerElement.classList.remove('defra-map--info-open')
    // Re-enable screen reader access to siblings
    hideSiblings(false)
    keyElement.setAttribute('aria-hidden', state.isTablet)
    state.isAttributionsOpen ? attributtionButtonElement.focus() : viewport.focus()
    state.isAttributionsOpen = false
  }

  //
  // Public properties
  //

  this.map = map
  this.containerElement = containerElement
  this.viewport = viewport
  this.viewportDescription = viewportDescription
  this.keyElement = keyElement
  this.infoElement = infoElement
  this.resetButton = resetButtonElement
  this.openKeyButton = openKeyButtonElement
  this.closeKeyButton = closeKeyButton
  this.closeInfoButton = closeInfoButton
  this.attributionButton = attributtionButtonElement
  this.state = state

  //
  // Public methods
  //

  this.showInfo = (title, body) => {
    // Close key if its currently open
    closeKey()
    // Prevent screen reader from accessing siblings and key
    hideSiblings(true)
    keyElement.setAttribute('aria-hidden', true)
    containerElement.classList.add('defra-map--info-open')
    // Temporarily stop screen reader announcing viewport changes
    viewport.setAttribute('aria-live', 'off')
    infoLabel.innerText = title
    infoContent.innerHTML = body
    containerElement.appendChild(infoElement)
    state.isInfoOpen = true
    infoElement.focus()
  }

  //
  // Events
  //

  // Mobile behavior
  const mobileMediaQuery = window.matchMedia('(max-width: 640px)')
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
  const tabletMediaQuery = window.matchMedia('(max-width: 834px)')
  const tabletListener = (tabletMediaQuery) => {
    state.isTablet = tabletMediaQuery.matches
    state.isKeyOpen = (containerElement.classList.contains('defra-map--key-open') && state.isTablet) || !state.isTablet
    keyElement.setAttribute('role', state.isTablet ? 'dialog' : 'region')
    hideSiblings(state.isInfoOpen || (state.isKeyOpen && state.isTablet))
    closeKeyButton.hidden = !state.isTablet
    openKeyButtonElement.hidden = !state.isTablet
    if (state.isTablet) {
      keyElement.setAttribute('open', state.isKeyOpen)
      keyElement.setAttribute('aria-modal', true)
      keyElement.style.display = state.isKeyOpen ? 'block' : 'none' // Safari v14 bug
    } else {
      keyElement.removeAttribute('open')
      keyElement.removeAttribute('aria-modal')
      keyElement.style.display = 'block' // Safari v14 bug
    }
    keyElement.setAttribute('aria-hidden', (state.isTablet && !state.isKeyOpen) || (!state.isTablet && state.isInfoOpen))
  }
  tabletMediaQuery.addListener(tabletListener)
  tabletListener(tabletMediaQuery)

  // Map click
  map.on('click', (e) => {
    // Hide key
    if (state.isTablet && state.isKeyOpen) { closeKey() }
    // Close info panel
    if (state.isInfoOpen) { closeInfo() }
    viewport.focus()
  })

  // Exit map click
  exitMapButtonElement.addEventListener('click', (e) => {
    exitMap()
  })

  // Open key click
  openKeyButtonElement.addEventListener('click', (e) => {
    openKey()
  })

  // Close key click
  closeKeyButton.addEventListener('click', (e) => {
    closeKey()
  })

  // Show attributions click
  attributtionButtonElement.addEventListener('click', (e) => {
    const infoDescription = document.createElement('div')
    infoDescription.id = 'infoDescription'
    state.isAttributionsOpen = true
    const attribution = new Attribution({
      collapsible: false,
      target: infoDescription
    })
    this.showInfo('Attributions', '')
    map.addControl(attribution)
    infoContent.appendChild(infoDescription)
    infoDescription.querySelector('button').parentNode.removeChild(infoDescription.querySelector('button'))
  })

  // Close info click
  closeInfoButton.addEventListener('click', (e) => {
    closeInfo()
  })

  // Mouse or touch interaction
  containerElement.addEventListener('pointerdown', (e) => {
    infoElement.blur()
    keyElement.blur()
    viewport.removeAttribute('keyboard-focus')
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

  // Tabrings and regions
  const keydown = (e) => {
    if (e.key !== 'Tab' && e.key !== 'F6') { return }
    tabletListener(tabletMediaQuery)
    // Constrain tab keypress to current dialog
    if (e.key === 'Tab') {
      const tabring = document.activeElement.closest('*[role="dialog"]') || containerElement
      const selectors = [
        'a[href]:not([disabled]):not([hidden])',
        'button:not([disabled]):not([hidden])',
        'textarea:not([disabled]):not([hidden])',
        'input[type="text"]:not([disabled]):not([hidden])',
        'input[type="radio"]:not([disabled]):not([hidden])',
        'input[type="checkbox"]:not([disabled]):not([hidden])',
        'select:not([disabled]):not([hidden])',
        '*[tabindex="0"]:not([disabled]):not([hidden])'
      ]
      let specificity = selectors.map(i => `#${tabring.id} ${i}`).join(',')
      if (tabring.classList.contains('defra-map')) {
        specificity = `#${tabring.id} div[role="application"]` + ','
        specificity += selectors.map(i => `#${tabring.id} > .defra-map-controls ${i}`).join(',') + ','
        specificity += selectors.map(i => `#${tabring.id} div[role="region"] ${i}`).join(',')
      }
      const focusableEls = document.querySelectorAll(specificity)
      const firstFocusableEl = focusableEls[0]
      const lastFocusableEl = focusableEls[focusableEls.length - 1]
      // Tab and shift tab
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableEl || document.activeElement.getAttribute('tabindex') === '-1') {
          lastFocusableEl.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus()
          e.preventDefault()
        }
      }
      // VoiceOver verbosity issues?? Remove info label and descrition
      if (state.isInfoOpen) {
        infoElement.removeAttribute('aria-labelledby')
        infoElement.removeAttribute('aria-describedby')
      }
    }
    // Move focus between regions
    if ((e.ctrlKey || e.metaKey) && e.key === 'F6') {
      const regionSelector = '.defra-map div[role="dialog"][open="true"], .defra-map div[role="region"], .defra-map div[role="application"]'
      const regions = [].slice.call(document.querySelectorAll(regionSelector))
      const activeRegion = document.activeElement.closest(regionSelector) || viewport
      const activeIndex = regions.indexOf(activeRegion)
      let nextIndex = activeIndex
      if (e.shiftKey) {
        nextIndex = activeIndex === 0 ? regions.length - 1 : activeIndex - 1
      } else {
        nextIndex = activeIndex === regions.length - 1 ? 0 : activeIndex + 1
      }
      regions[nextIndex].focus()
      document.activeElement.setAttribute('keyboard-focus', '')
    }
  }
  window.addEventListener('keydown', keydown)

  // Escape (keyup) to close dialogs
  const keyup = (e) => {
    // Tabbing into web area from browser controls
    if (!containerElement.contains(document.activeElement)) {
      const firstInteractiveElement = containerElement.querySelector('#info[open="true"], #key[open="true"][role="dialog"]') || viewport
      firstInteractiveElement.focus()
      firstInteractiveElement.setAttribute('keyboard-focus', '')
    }
    // Escape key behavior
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (state.isInfoOpen) {
        closeInfoButton.click()
      } else if (state.isTablet && state.isKeyOpen) {
        closeKeyButton.click()
      } else {
        exitMapButtonElement.click()
      }
    }
    // VoiceOver verbosity issues?? Re-instate info label and description
    if (state.isInfoOpen) {
      infoElement.setAttribute('aria-labelledby', 'infoLabel')
      infoElement.setAttribute('aria-describedby', 'infoDescription')
    }
  }
  window.addEventListener('keyup', keyup)

  // Remove map on popsate change
  const popstate = (e) => {
    removeContainer()
  }
  window.addEventListener('popstate', popstate)
}
