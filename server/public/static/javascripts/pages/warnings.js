// Add back button
(function (window, flood) {
  const maps = flood.maps
  const utils = flood.utils
  const model = flood.model

  // Add browser back button
  utils.addBrowserBackButton()

  if (model.countFloods) {
    // Create LiveMap if querystring is present
    if (utils.getParameterByName('v') === 'map-live') {
      maps.createLiveMap('map-live')
    }
    // Create LiveMap if show map button pressed
    var buttonContainer = document.getElementById('searchSummary')
    if (buttonContainer) {
      const button = document.createElement('button')
      button.innerText = 'View on map'
      button.id = 'map-btn'
      button.className = 'defra-search-summary__button-map'
      button.addEventListener('click', function (e) {
        e.preventDefault()
        maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'ts,tw,ta' })
      })
      buttonContainer.append(button)
    }
    // Create LiveMap if history changes
    var mapContainer = document.getElementById('map-live')
    window.addEventListener('popstate', function (e) {
      if (mapContainer.firstChild) {
        mapContainer.removeChild(mapContainer.firstChild)
      }
      if (e && e.state) {
        maps.createLiveMap('map-live')
      }
    })
  }
})(window, window.flood)
