'use strict'
import '../components/nunjucks'
import '../components/maps'
import '../components/maps-styles'
import '../components/maps-layers'
import '../components/map-container'
import '../components/maps/live'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Create LiveMap if querystring is present
if (window.flood.utils.getParameterByName('v') === 'map-live') {
  window.flood.maps.createLiveMap('map-live')
}
// Create LiveMap if show map button pressed
var mapContainer = document.getElementById('map-live')
if (mapContainer) {
  let extent = window.flood.model.placeBbox
  extent = extent.map(function (x) { return Number(x.toFixed(6)) })
  // Create map button with parameters
  const button = document.createElement('button')
  button.id = 'map-btn'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.innerText = 'View map of flood warning and alert areas'
  button.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'ts,tw,ta', ext: extent.join(',') })
  })
  mapContainer.parentNode.insertBefore(button, mapContainer)
}
// Create LiveMap if history changes
window.addEventListener('popstate', function (e) {
  if (mapContainer.firstChild) {
    mapContainer.removeChild(mapContainer.firstChild)
  }
  if (e && e.state) {
    window.flood.maps.createLiveMap('map-live')
  }
})
