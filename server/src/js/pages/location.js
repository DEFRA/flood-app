'use strict'
import '../components/nunjucks'
import '../components/maps'
import '../components/maps-styles'
import '../components/maps-layers'
import '../components/map-container'
import '../components/maps/live'
// import { fromLonLat } from 'ol/proj'
// import { Feature } from 'ol'
// import { MultiPolygon } from 'ol/geom'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Create LiveMap if show map button pressed
const buttonContainer = document.getElementById('map-live')
if (buttonContainer) {
  // Create map button with parameters
  const button = document.createElement('button')
  button.innerText = 'View map of flood warning and alert areas'
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
