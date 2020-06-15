'use strict'
import '../components/nunjucks'
import '../components/maps'
import '../components/maps/outlook'
import '../components/maps-styles'
import '../components/maps-layers'
import '../components/map-container'
import '../components/maps/live'
// Outlook map
const outlookMapContainer = document.getElementById('map-outlook')
if (outlookMapContainer) {
  const button = document.createElement('button')
  button.innerText = 'View map showing areas of concern 123'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.addEventListener('click', function (e) {
    e.preventDefault()
    // Instantiate and show map
    window.flood.maps.createOutlookMap({})
  })
  outlookMapContainer.parentNode.insertBefore(button, outlookMapContainer)
  // Instantiate and show map if querystring parameter
  if (window.flood.utils.getParameterByName('v') === 'map-outlook') {
    window.flood.maps.createOutlookMap({ 'no-back': true })
  }
}

// Warning enhancement
var warningLinks = document.querySelectorAll('.defra-warning-flood a')
for (var i = 0; i < warningLinks.length; ++i) {
  var href = warningLinks[i].href
  var warning = warningLinks[i].closest('.defra-warning-flood')
  warning.addEventListener('mouseenter', function (e) {
    this.classList.add('defra-warning-flood--hover')
  })
  warning.addEventListener('mouseleave', function (e) {
    this.classList.remove('defra-warning-flood--hover')
  })
  warning.addEventListener('click', function (e) {
    window.location = href
  })
}

// Create LiveMap if show map button pressed
const buttonContainer = document.getElementById('map-live')
if (buttonContainer) {
  // Create map button with parameters
  const button = document.createElement('button')
  button.innerText = 'View map of flood warnings and alerts'
  button.id = 'map-btn'
  button.className = 'defra-button-map'
  button.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'ts,tw,ta', ext: '' })
  })
  buttonContainer.appendChild(button)
}
// Create LiveMap if history changes
const mapContainer = document.getElementById('map-live')
window.addEventListener('popstate', function (e) {
  if (mapContainer.firstChild) {
    mapContainer.removeChild(mapContainer.firstChild)
  }
  if (e && e.state) {
    window.flood.maps.createLiveMap('map-live')
  }
})
