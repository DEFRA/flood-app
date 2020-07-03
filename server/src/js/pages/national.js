'use strict'
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
    layers: 'mv,ts,tw,ta'
  })
}

// Create Outlook Map
if (document.getElementById('map-outlook')) {
  window.flood.maps.createOutlookMap('map-outlook', {
    btnText: 'View map showing areas of concern',
    btnClasses: 'defra-button-map',
    days: window.flood.model.outlook.days
  })
}
