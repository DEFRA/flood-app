'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/map/outlook'

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

// Create Outlook Map
if (document.getElementById('map-outlook')) {
  window.flood.maps.createOutlookMap('map-outlook', {
    btnText: 'View map showing flood risk areas',
    btnClasses: 'defra-button-map govuk-!-margin-bottom-4',
    days: window.flood.model.outlookDays,
    bbox: window.flood.model.placeBbox
  })
}
