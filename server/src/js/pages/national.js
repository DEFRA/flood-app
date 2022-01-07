'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/map/outlook'

// Create Live Map
if (document.getElementById('map-live')) {
  window.flood.maps.createLiveMap('map-live', {
    btnText: 'View map of flood warnings and alerts',
    btnClasses: 'defra-button-map',
    data: {
      button: 'National:Map-View:View-national-warning-map',
      aerial: 'National-Map:Map-interaction:View-satelite-basemap'
    },
    layers: 'mv,ts,tw,ta'
  })
}

// Create Outlook Map
if (document.getElementById('map-outlook')) {
  window.flood.maps.createOutlookMap('map-outlook', {
    btnText: 'View map showing flood risk areas',
    btnClasses: 'defra-button-map',
    days: window.flood.model.outlook.days
  })
}
