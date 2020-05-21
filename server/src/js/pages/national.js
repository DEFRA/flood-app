'use strict'
import '../components/nunjucks'
import '../core'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Outlook map
/*
const outlookMapContainer = document.getElementById('map-outlook')
if (outlookMapContainer) {
  const button = document.createElement('button')
  button.innerText = 'View map showing areas of concern'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.addEventListener('click', function (e) {
    e.preventDefault()
    // Instantiate and show map
    window.flood.maps.createOutlookMap({})
  })
  outlookMapContainer.parentNode.insertBefore(button, outlookMapContainer)
  // Instantiate and show map if querystring parameter
  if (window.flood.utils.getParameterByName('v') === 'map-outlook') {
    window.flood.maps.createOutlookMap({ 'no-back': true })
  }
}
*/
