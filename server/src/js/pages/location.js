'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/map/outlook'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: window.flood.model.hasWarnings ? 'View map of flood warnings and alerts' : 'View map',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon govuk-!-margin-bottom-4',
    data: {
      button: 'Location:Map view:Location - View national warning map'
    },
    layers: 'mv,ts,tw,ta',
    extent: window.flood.model.placeBbox
  })
}

// Create Outlook Map
if (document.getElementById('map-outlook')) {
  window.flood.maps.createOutlookMap('map-outlook', {
    btnText: 'View map showing flood risk areas',
    btnClasses: 'defra-button-secondary defra-button-secondary--icon',
    data: {
      button: 'Location:Map view:View outlook map'
    },
    days: window.flood.model.outlookDays,
    bbox: window.flood.model.placeBbox
  })
}
