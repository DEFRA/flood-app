// Add back button
(function (window, flood) {
  const maps = flood.maps
  const utils = flood.utils
  const model = flood.model

  // Add browser back button
  utils.addBrowserBackButton()

  // Add map button and setup map
  if (model.countFloods) {
    // Create map button
    const buttonContainer = document.getElementById('searchSummary')
    if (buttonContainer) {
      const button = document.createElement('button')
      button.innerText = 'View on map'
      button.className = 'defra-search-summary__button-map'
      button.addEventListener('click', function (e) {
        e.preventDefault()
        // Instantiate and show map when button pressed
        maps.createLiveMap({ l: 'sw,w,a' })
      })
      buttonContainer.append(button)
      // Instantiate and show map if querystring parameter present
      if (flood.utils.getParameterByName('v') === 'map-live') {
        maps.createLiveMap({ l: 'sw,w,a' })
      }
    }
  }
})(window, window.flood)
