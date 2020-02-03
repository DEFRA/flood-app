'use strict'
import '../components/nunjucks'
import '../components/maps'
import '../components/maps-styles'
import '../components/maps-layers'
import '../components/map-container'
import '../components/maps/live'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Add locator
// container.addLocator(name, centre)

// Add map button and setup map
if (window.flood.model.countActiveImpacts) {
  // Create LiveMap if querystring is present
  if (window.flood.utils.getParameterByName('v') === 'map-live') {
    window.flood.maps.createLiveMap('map-live')
  }
  // Create LiveMap if show map button pressed
  const buttonContainer = document.getElementById('searchSummary')
  if (buttonContainer) {
    // Get extent LatLon from target area
    let extent = window.flood.model.placeBbox
    extent = extent.map(function (x) { return Number(x.toFixed(6)) })
    // Create map button with parameters
    const button = document.createElement('button')
    button.innerText = 'View on map'
    button.id = 'map-btn'
    button.className = 'defra-search-summary__button-map'
    button.addEventListener('click', function (e) {
      e.preventDefault()
      window.flood.maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'hi', ext: extent.join(',') })
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
}
