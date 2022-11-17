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
    btnText: window.flood.model.hasActiveFloods ? 'View map of flood warning and alert areas' : 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    data: {
      button: 'National:Map-View:View-National-warning-map',
      checkBox: 'National-Map:Map interaction:Map - Layer interaction',
      aerial: 'National-Map:Map-interaction:View-satelite-basemap'
    },
    layers: 'mv,ts,tw,ta'
  })
}

// Create Outlook Map
if (document.getElementById('map-outlook')) {
  window.flood.maps.createOutlookMap('map-outlook', {
    btnText: 'View map showing flood risk areas',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    data: {
      button: 'Outlook:Map-View:View-Outlook-warning-map',
      checkBox: 'Outlook:Map interaction:Map - Layer interaction'
    },
    days: window.flood.model.outlook.days
  })
}
