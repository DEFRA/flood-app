'use strict'
import 'elm-pep'
import '../components/line-chart'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/toggle-list-display'
import '../components/toggletip'

// Create LiveMap
window.flood.maps.createLiveMap('map', {
  btnText: 'Map',
  btnClasses: 'defra-link-icon-s',
  layers: 'mv,ri,ti,gr,rf',
  data: {
    button: 'Station:Map View:Station - View map',
    checkBox: 'Station:Map interaction:Map - Layer interaction',
    aerial: 'Station:Map interaction:View-satelite-basemap'
  },
  centre: window.flood.model.centre.split(','),
  selectedId: 'stations.' + window.flood.model.id,
  zoom: 14
})

// Line chart
if (document.getElementById('line-chart')) {
  const lineChart = window.flood.charts.createLineChart('line-chart', window.flood.model.id, window.flood.model.telemetry)
  const thresholdId = 'threshold-pc5'
  const threshold = document.querySelector(`[data-id="${thresholdId}"]`)
  if (threshold) {
    lineChart.addThreshold({
      id: thresholdId,
      name: threshold.getAttribute('data-name'),
      level: Number(threshold.getAttribute('data-level'))
    })
  }
}

// Add toggle list display for impacts
const toggleListDisplay = document.getElementById('toggle-list-display')
if (toggleListDisplay) {
  window.flood.createToggleListDisplay(toggleListDisplay, {
    type: 'impact',
    btnText: 'historical events'
  })
}

// Toggletips
if (document.querySelectorAll('[data-toggletip]')) {
  window.flood.createToggletips()
}
