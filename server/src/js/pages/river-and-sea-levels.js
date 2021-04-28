'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/filter'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-map-s',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model.placeBbox
  })
}

// Create filter
if (document.getElementById('filter')) {
  window.flood.Filter('filter', 'defra-flood-list')
}
