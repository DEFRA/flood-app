'use strict'
import '../components/charts'

// Add browser back button
window.flood.utils.addBrowserBackButton()

var chart = document.getElementsByClassName('defra-line-chart')

if (chart.length) {
  // If javascript is enabled make content visible to all but assitive technology
  // var figure = chart.parentNode
  chart[0].setAttribute('aria-hidden', true)
  chart[0].removeAttribute('hidden')
  // Create line chart instance
  var lineChart = window.flood.charts.createLineChart('line-chart', {
    now: new Date(),
    observed: window.flood.model.telemetry,
    forecast: window.flood.model.ffoi ? window.flood.model.ffoi.processedValues : []
  })
  if (window.flood.utils.getParameterByName('t')) {
    // Find threshold in model
    var thresholdId = window.flood.utils.getParameterByName('t')
    var matchedThresholds = []
    window.flood.model.thresholds.forEach(function (threshold) {
      matchedThresholds = matchedThresholds.concat(threshold.values.filter(function (value) {
        return (value.id === parseInt(thresholdId))
      }))
    })
    var threshold = matchedThresholds[0]
    // console.log(impact)
    lineChart.addThreshold({
      id: threshold.id,
      level: threshold.value,
      name: threshold.shortname
    })
  } else if (window.flood.model.station.percentile5) {
    lineChart.addThreshold({
      id: 'alert',
      level: window.flood.model.station.percentile5,
      name: 'Top of typical range'
    })
  }
  // Add threshold buttons
  document.querySelectorAll('.defra-flood-impact-list__action').forEach(impact => {
    const button = document.createElement('button')
    button.innerHTML = 'Show on chart'
    button.className = 'defra-table-impact__button'
    button.addEventListener('click', function (e) {
      lineChart.addThreshold({
        id: impact.getAttribute('data-id'),
        level: Number(impact.getAttribute('data-level')),
        name: impact.getAttribute('data-name')
      })
    })
    impact.querySelector('td:last-child').appendChild(button)
  })
  // Add location map button
  var location = document.getElementById('location')
  const button = document.createElement('button')
  button.innerText = location.innerText
  button.className = 'defra-button-map defra-button-map--small'
  button.title = 'View map'
  button.addEventListener('click', function (e) {
    e.preventDefault()
  })
  location.innerHTML = ''
  location.appendChild(button)
}
