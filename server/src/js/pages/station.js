'use strict'
import 'elm-pep'
import '../components/charts'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'
import '../components/toggle-list-display'

// Create LiveMap
window.flood.maps.createLiveMap('map', {
  btnText: 'View map',
  btnClasses: 'defra-button-map-s',
  layers: 'mv,ri,ti,gr,rf',
  data: {
    button: 'Station:Map View:Station - View map'
  },
  centre: JSON.parse(window.flood.model.station.coordinates).coordinates,
  selectedId: 'stations.' + window.flood.model.station.id,
  zoom: 14
})

const chart = document.querySelector('.defra-line-chart')
if (chart) {
  // If javascript is enabled make content visible to all but assitive technology
  // var figure = chart.parentNode
  chart.setAttribute('aria-hidden', true)
  chart.removeAttribute('hidden')
  // Create line chart instance
  const lineChart = window.flood.charts.createLineChart('line-chart', {
    now: new Date(),
    observed: window.flood.model.telemetry,
    forecast: window.flood.model.ffoi && !window.flood.model.forecastOutOfDate ? window.flood.model.ffoi.processedValues : [],
    plotNegativeValues: window.flood.model.station.plotNegativeValues
  })
  if (Object.keys(lineChart).length) {
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
      const typical = document.querySelector('.defra-flood-impact-list__value[data-id="pc5"]:last-child')
      if (typical) {
        lineChart.addThreshold({
          id: typical.getAttribute('data-id'),
          level: Number(typical.getAttribute('data-level')),
          name: typical.getAttribute('data-name')
        })
      }
    }
    // Add threshold buttons
    Array.from(document.querySelectorAll('.defra-flood-impact-list__value')).forEach(value => {
      const button = document.createElement('button')
      button.innerHTML = 'Show on chart<span class="govuk-visually-hidden"> (Visual only)</span>'
      button.setAttribute('data-journey-click', 'Station:Chart interaction:Station - show on chart')
      button.className = 'defra-button-text-s'
      button.addEventListener('click', function (e) {
        lineChart.addThreshold({
          id: value.getAttribute('data-id'),
          level: Number(value.getAttribute('data-level')),
          name: value.getAttribute('data-name')
        })
        // Scroll viewport to chart
        const offsetTop = chart.getBoundingClientRect().top + window.pageYOffset
        window.scrollTo(0, offsetTop)
      })
      const action = value.querySelector('.defra-flood-impact-list__action')
      if (action) {
        action.appendChild(button)
      }
    })
  }
}

// Add toggle list display for imapacts
const toggleListDisplay = document.getElementById('toggle-list-display')
if (toggleListDisplay) {
  window.flood.createToggleListDisplay(toggleListDisplay, {
    type: 'impact',
    btnText: 'historical events'
  })
}
