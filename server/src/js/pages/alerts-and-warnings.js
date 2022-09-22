'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

if (document.getElementById('map')) {
// Create LiveMap
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map of flood warnings and alerts',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ts,tw,ta',
    extent: window.flood.model.placeBbox
  })
}
