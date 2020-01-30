'use strict'
import '../components/nunjucks'
import '../components/maps'
import '../components/maps-styles'
import '../components/maps-layers'
import '../components/map-container'
import '../components/maps/live'

// Add browser back button
window.flood.utils.addBrowserBackButton()

if (window.flood.model.countFloods) {
  // Create LiveMap if querystring is present
  if (window.flood.utils.getParameterByName('v') === 'map-live') {
    window.flood.maps.createLiveMap('map-live', { 'no-back': true })
  }
  // Create LiveMap if show map button pressed
  var buttonContainer = document.getElementById('searchSummary')
  if (buttonContainer) {
    // Get extent LatLon from target area
    var extent = window.flood.model.placeBbox
    extent = extent.map(function (x) { return Number(x.toFixed(6)) })
    // Create map button with parameters
    const button = document.createElement('button')
    button.innerText = 'View on map'
    button.id = 'map-btn'
    button.className = 'defra-search-summary__button-map'
    button.addEventListener('click', function (e) {
      e.preventDefault()
      window.flood.maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'ts,tw,ta', ext: extent.join(',') })
    })
    buttonContainer.appendChild(button)
  }
  // Create LiveMap if history changes
  var mapContainer = document.getElementById('map-live')
  window.addEventListener('popstate', function (e) {
    if (mapContainer.firstChild) {
      mapContainer.removeChild(mapContainer.firstChild)
    }
    if (e && e.state) {
      window.flood.maps.createLiveMap('map-live')
    }
  })
}
