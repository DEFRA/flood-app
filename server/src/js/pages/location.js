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
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map of flood warning and alert areas',
    btnClasses: 'defra-button-map',
    layers: 'mv,ts,tw,ta',
    extent: window.flood.model.placeBbox
  })
}
