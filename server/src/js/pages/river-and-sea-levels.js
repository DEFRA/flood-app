'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/filter'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-map-s',
    layers: 'mv,ri,ti,gr,rf',
    extent: window.flood.model.placeBbox,
    selectedId: window.flood.model.originalStationId
  })
}

// Create filter
if (document.getElementById('filter')) {
  window.flood.Filter('filter', 'defra-flood-list')
}

// Back to top button
const backToTop = document.querySelector('.defra-top-link')
const offsetBottomElement = document.querySelector('.govuk-footer')
const offsetTopElement = document.getElementById('resetFilters')

const offsetTop = offsetTopElement.offsetTop
const offsetBottom = offsetBottomElement.offsetTop - window.innerHeight

window.onscroll = function () {
  scrollFunction()
}

function scrollFunction () {
  if ((document.body.scrollTop >= offsetTop && document.body.scrollTop <= offsetBottom) || (document.documentElement.scrollTop >= offsetTop && document.documentElement.scrollTop <= offsetBottom)) {
    backToTop.classList.add('defra-top-link--fixed')
  } else {
    backToTop.classList.remove('defra-top-link--fixed')
  }
}
