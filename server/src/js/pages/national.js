'use strict'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/outlook'

// Create LiveMap
if (document.getElementById('map-outlook')) {
  window.flood.maps.createOutlookMap('map-outlook', {
    btnText: 'View map showing areas of concern',
    btnClasses: 'defra-button-map govuk-!-margin-bottom-4',
    days: window.flood.model.outlook.days
  })
}
