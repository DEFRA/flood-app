'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/levels-table'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map of levels',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model ? window.flood.model.placeBox : null,
    data: {
      button: 'River-list:Map-View:View-Live-warning-map',
      aerial: 'River-list-Map:Map-interaction:View-satelite-basemap'
    },
    selectedId: window.flood.model ? window.flood.model.originalStationId : null
  })
}

// Add category tabs progressive enhancement
if (document.getElementById('filter')) {
  window.flood.createLevelsTable('filter')
}
