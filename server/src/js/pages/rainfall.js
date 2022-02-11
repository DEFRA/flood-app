'use strict'
import 'elm-pep'
import '../components/bar-chart'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/toggletip'

// Create LiveMap
if (document.getElementById('map')) {
  window.flood.maps.createLiveMap('map', {
    btnText: 'View map',
    btnClasses: 'defra-button-map-s govuk-!-margin-right-1',
    layers: 'mv,rf',
    centre: window.flood.model.centroid,
    zoom: 14,
    selectedId: `rainfall_stations.${window.flood.model.id}`
  })
}

// Create bar chart
if (document.getElementById('bar-chart')) {
  window.flood.charts.createBarChart('bar-chart', window.flood.model.stationId, window.flood.model.telemetry)
}

// Add toggletips
if (document.querySelectorAll('.defra-toggletip')) {
  window.flood.createToggletips()
}
