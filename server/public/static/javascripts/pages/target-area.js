// Add back button
(function (window, flood) {
  const maps = flood.maps
  const utils = flood.utils
  const model = flood.model

  // Add browser back button
  utils.addBrowserBackButton()

  // Create map button and set up map
  const buttonContainer = document.getElementById('map-live')
  if (buttonContainer) {
    const button = document.createElement('button')
    button.innerText = 'View map of the flood risk area'
    button.className = 'defra-button-map govuk-!-margin-bottom-4'
    button.addEventListener('click', function (e) {
      e.preventDefault()
      // Instantiate and show map
      maps.createLiveMap({ l: 'sw,w,a', f: model.featureId })
    })
    buttonContainer.parentNode.insertBefore(button, buttonContainer)
    // Instantiate and show map if querystring parameter
    if (flood.utils.getParameterByName('v') === 'map-live') {
      maps.createLiveMap({ l: 'sw,w,a', f: model.featureId })
    }
  }
})(window, window.flood)
