'use strict'
import '../components/charts'
import '../components/nunjucks'
import '../components/maps'
import '../components/maps-styles'
import '../components/maps-layers'
import '../components/map-container'
import '../components/maps/live'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Create LiveMap if querystring is present
if (window.flood.utils.getParameterByName('v') === 'map-live') {
  window.flood.maps.createLiveMap('map-live')
}
// Create LiveMap if show map button pressed
const buttonContainer = document.querySelector('.defra-flood-nav')
if (buttonContainer) {
  // Create map button with parameters
  const button = document.createElement('button')
  button.innerHTML = '<span>View on map</span>'
  button.id = 'map-btn'
  button.className = 'defra-button-map-s'
  button.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'st' })
  })
  buttonContainer.appendChild(button)
}
// Create LiveMap if history changes
const mapContainer = document.querySelector('.defra-flood-nav')
window.addEventListener('popstate', function (e) {
  if (mapContainer.firstChild) {
    mapContainer.removeChild(mapContainer.firstChild)
  }
  if (e && e.state) {
    window.flood.maps.createLiveMap('map-live')
  }
})

const chart = document.getElementsByClassName('defra-line-chart')

if (chart.length) {
  // If javascript is enabled make content visible to all but assitive technology
  // var figure = chart.parentNode
  chart[0].setAttribute('aria-hidden', true)
  chart[0].removeAttribute('hidden')
  // Create line chart instance
  const lineChart = window.flood.charts.createLineChart('line-chart', {
    now: new Date(),
    observed: window.flood.model.telemetry,
    forecast: window.flood.model.ffoi ? window.flood.model.ffoi.processedValues : []
  })
  if (window.flood.utils.getParameterByName('t')) {
    // Find threshold in model
    const thresholdId = window.flood.utils.getParameterByName('t')
    let matchedThresholds = []
    window.flood.model.thresholds.forEach(function (threshold) {
      matchedThresholds = matchedThresholds.concat(threshold.values.filter(function (value) {
        return (value.id.toString() === thresholdId)
      }))
    })
    const threshold = matchedThresholds[0]
    lineChart.addThreshold({
      id: threshold.id,
      level: threshold.value,
      name: threshold.shortname
    })
  } else {
    const typical = document.querySelector('.defra-flood-impact-list__value[data-id="alert"], .defra-flood-impact-list__value[data-id="pc95"]')
    if (typical) {
      lineChart.addThreshold({
        id: typical.getAttribute('data-id'),
        level: Number(typical.getAttribute('data-level')),
        name: typical.getAttribute('data-name')
      })
    }
  }

  // Add threshold buttons
  document.querySelectorAll('.defra-flood-impact-list__value').forEach(value => {
    const button = document.createElement('button')
    button.innerHTML = 'Show on chart'
    button.className = 'defra-button-text-s'
    button.addEventListener('click', function (e) {
      lineChart.addThreshold({
        id: value.getAttribute('data-id'),
        level: Number(value.getAttribute('data-level')),
        name: value.getAttribute('data-name')
      })
    })
    const action = value.querySelector('.defra-flood-impact-list__action')
    if (action) {
      action.appendChild(button)
    }
  })
}
