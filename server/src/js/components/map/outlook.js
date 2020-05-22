'use strict'
// This file represents the 5 day outlook used on the national page.
// It uses the MapContainer
// TODO: needs refactoring into layers and styles
// ALSO need to fix the functionality, I don't think the tickets have been developed as of 31/01/2020
import { View } from 'ol'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { defaults as defaultInteractions } from 'ol/interaction'
import { GeoJSON } from 'ol/format'
import { Style, Fill } from 'ol/style'
import { unByKey } from 'ol/Observable'
import { Control } from 'ol/control'

const { addOrUpdateParameter, getParameterByName, forEach } = window.flood.utils
const maps = window.flood.maps
const { setExtentFromLonLat, getLonLatFromExtent } = window.flood.maps
const MapContainer = maps.MapContainer

function OutlookMap (mapId, options) {
  // View
  const view = new View({
    zoom: 6,
    minZoom: 6,
    maxZoom: 7,
    center: maps.center,
    extent: maps.extentLarge
  })

  // Fill patterns
  const pattern = () => {
    const canvas = document.createElement('canvas')
    const dpr = window.devicePixelRatio || 1
    canvas.width = 8 * dpr
    canvas.height = 8 * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, 8, 8)
    ctx.beginPath()
    ctx.lineCap = 'square'
    ctx.strokeStyle = '#ffbf47'
    ctx.lineWidth = 2
    ctx.moveTo(-2, 2)
    ctx.lineTo(2, -2)
    ctx.stroke()
    ctx.moveTo(-2, 10)
    ctx.lineTo(10, -2)
    ctx.stroke()
    ctx.moveTo(6, 10)
    ctx.lineTo(10, 6)
    ctx.stroke()
    ctx.restore()
    return ctx.createPattern(canvas, 'repeat')
  }

  // Styles
  const style = (feature) => {
    if (!feature.get('isVisible')) {
      return
    }
    // const strokeColour = '#6f777b'
    // const strokeWidth = 2
    const zIndex = feature.get('z-index')
    const lineDash = [2, 3]
    let fillColour = pattern()
    if (feature.get('risk-level') === 2) {
      fillColour = '#ffbf47'
    } else if (feature.get('risk-level') === 3) {
      fillColour = '#F47738'
    } else if (feature.get('risk-level') === 4) {
      fillColour = '#df3034'
    }
    return new Style({
      fill: new Fill({ color: fillColour }),
      lineDash: lineDash,
      zIndex: zIndex
    })
  }

  // Layers
  const road = maps.layers.road()
  const areasOfConcern = new VectorLayer({
    ref: 'areasOfConcern',
    source: new VectorSource({
      format: new GeoJSON(),
      projection: 'EPSG:3857',
      url: '/api/outlook.geojson'
    }),
    renderMode: 'hybrid',
    style: style,
    opacity: 0.9,
    zIndex: 200
  })

  // Configure default interactions
  const interactions = defaultInteractions({
    pinchRotate: false
  })

  // Format date Today, Yesterday, Tomorrow or 'Mon 1'
  const formatDate = (date) => {
    date.setDate(date.getDate() + 233)
    let format = days[date.getDay()] + ' ' + date.getDate()
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0, 0)
    const now = new Date()
    now.setHours(0)
    now.setMinutes(0)
    now.setSeconds(0, 0)
    if (date.getTime() === now.getTime()) {
      format = 'Today'
    } else if (date.getTime() + 86400000 === now.getTime()) {
      format = 'Yesterday'
    } else if (date.getTime() - 86400000 === now.getTime()) {
      format = 'Tomorrow'
    }
    return format
  }

  // Create day control
  const dayControlsElement = document.createElement('div')
  dayControlsElement.className = 'defra-map-days'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  options.days.forEach(function (day) {
    const dayButtonElement = document.createElement('button')
    dayButtonElement.className = 'defra-map-days__button'
    dayButtonElement.setAttribute('data-risk-level', day.level)
    dayButtonElement.setAttribute('data-day', day.idx)
    dayButtonElement.setAttribute('aria-selected', false)
    const date = formatDate(new Date(day.date))
    dayButtonElement.innerHTML = `${date}<span class="defra-map-days__icon defra-map-days__icon--risk-level-${day.level}"></span>`
    dayControlsElement.appendChild(dayButtonElement)
  })
  const dayControl = new Control({
    element: dayControlsElement
  })

  // Options to pass to the MapContainer constructor
  const containerOptions = {
    view: view,
    layers: [road, areasOfConcern],
    controls: [dayControl],
    queryParamKeys: ['v'],
    interactions: interactions,
    headingText: options.headingText,
    keyTemplate: 'key-outlook.html',
    isBack: options.isBack
  }

  // Create MapContainer
  const container = new MapContainer(mapId, containerOptions)
  const map = container.map

  //
  // Private methods
  //

  // Outlook set day function
  const setDay = (day) => {
    // Set feature visibility
    areasOfConcern.getSource().forEachFeature((feature) => {
      const isVisible = parseInt(feature.get('day')) === parseInt(day)
      feature.set('isVisible', isVisible)
    })
    // Set button properties
    forEach(document.querySelectorAll('.defra-map-days__button'), (button, i) => {
      button.setAttribute('aria-selected', i + 1 === parseInt(day))
    })
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
  road.setVisible(true)

  //
  // Events
  //

  // Set first day when features have loaded
  const change = areasOfConcern.getSource().on('change', (e) => {
    if (e.target.getState() === 'ready') {
      unByKey(change) // Remove ready event when layer is ready
      setDay(1)
    }
  })

  // Day control button
  forEach(document.querySelectorAll('.defra-map-days__button'), (button) => {
    button.addEventListener('click', (e) => {
      setDay(e.target.getAttribute('data-day'))
    })
  })
}

// Export a helper factory to create this map
// onto the `maps` object.
// (This is done mainly to avoid the rule
// "do not use 'new' for side effects. (no-new)")
maps.createOutlookMap = (mapId, options = {}) => {
  // Set initial history state
  if (!window.history.state) {
    const data = {}
    const title = document.title
    const uri = window.location.href
    window.history.replaceState(data, title, uri)
  }

  // Create map button
  const btnContainer = document.getElementById(mapId)
  const button = document.createElement('button')
  button.id = mapId + '-btn'
  button.innerHTML = options.btnText || 'View map'
  button.className = options.btnClasses || 'defra-button-map'
  btnContainer.parentNode.replaceChild(button, btnContainer)

  // Detect keyboard interaction
  if (maps.isKeyboard !== false && maps.isKeyboard !== true) {
    window.addEventListener('keydown', (e) => {
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
  }

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
    const title = document.title
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
