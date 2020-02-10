'use strict'
import '../components/nunjucks'
import '../components/maps'
// import '../components/maps-styles'
import '../components/maps-layers'
import '../components/map-container'
import '../components/maps/outlook'

// Outlook map
const outlookMapContainer = document.getElementById('map-outlook')
if (outlookMapContainer) {
  const button = document.createElement('button')
  button.innerText = 'View map showing areas of concern'
  button.className = 'defra-button-map govuk-!-margin-bottom-4'
  button.addEventListener('click', function (e) {
    e.preventDefault()
    // Instantiate and show map
    window.flood.maps.createOutlookMap()
  })
  outlookMapContainer.parentNode.insertBefore(button, outlookMapContainer)
  // Instantiate and show map if querystring parameter
  if (window.flood.utils.getParameterByName('v') === 'map-outlook') {
    window.flood.maps.createOutlookMap()
  }
}

// Warning enhancement
var warningLinks = document.querySelectorAll('.defra-warning-flood a')
for (var i = 0; i < warningLinks.length; ++i) {
  var href = warningLinks[i].href
  var warning = warningLinks[i].closest('.defra-warning-flood')
  warning.addEventListener('mouseenter', function (e) {
    this.classList.add('defra-warning-flood--hover')
  })
  warning.addEventListener('mouseleave', function (e) {
    this.classList.remove('defra-warning-flood--hover')
  })
  warning.addEventListener('click', function (e) {
    window.location = href
  })
}
