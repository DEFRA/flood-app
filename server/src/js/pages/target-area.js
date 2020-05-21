'use strict'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Create LiveMap
window.flood.maps.createLiveMap('map', {
  btnText: `View map of flood ${window.flood.model.area.code.slice(4, 5).toLowerCase() === 'w' ? 'warning' : 'alert'} area`,
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4',
  layers: 'mv,ts,tw,ta,ti',
  targetArea: {
    id: 'flood.' + window.flood.model.area.code,
    name: window.flood.model.area.name,
    polygon: JSON.parse(window.flood.model.area.geom).coordinates // MultiPolygon coordinates array for boundary
  },
  selectedId: 'flood.' + window.flood.model.area.code
})

/*
// Create LiveMap if querystring is present
if (window.flood.utils.getParameterByName('v') === 'map-live') {
  window.flood.maps.createLiveMap('map-live')
}
// Create LiveMap if show map button pressed
var mapContainer = document.getElementById('map-live')
if (mapContainer) {
  // Get extent LatLon from target area
  var cooridnates = fromLonLat(JSON.parse(window.flood.model.area.geom).coordinates, 'EPSG:4326', 'EPSG:3857')
  var feature = new Feature({ geometry: new MultiPolygon(cooridnates) })
  var extent = feature.getGeometry().getExtent()
  extent = extent.map(function (x) { return Number(x.toFixed(6)) })
  // Create map button with parameters
  const button = document.createElement('button')
  button.id = 'map-btn'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.innerText = `${window.flood.model.mapTitle}`
  button.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'ts,tw,ta', fid: 'flood.' + window.flood.model.area.code.toLowerCase(), ext: extent.join(',') })
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
*/
