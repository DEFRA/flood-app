// Add back button
(function (window, flood) {
  const maps = flood.maps
  const utils = flood.utils
  const model = flood.model

  // Add browser back button
  utils.addBrowserBackButton()

  // Add map button and setup map
  if (model.levels) {
    // Create LiveMap if querystring is present
    if (utils.getParameterByName('v') === 'map-live') {
      maps.createLiveMap('map-live')
    }
    // Create LiveMap if show map button pressed
    var buttonContainer = document.getElementById('searchSummary')
    if (buttonContainer) {
      // Get extent LatLon from target area
      var extent = model.placeBbox
      extent = extent.map(function (x) { return Number(x.toFixed(6)) })
      // Create map button with parameters
      const button = document.createElement('button')
      button.innerText = 'View on map'
      button.id = 'map-btn'
      button.className = 'defra-search-summary__button-map'
      button.addEventListener('click', function (e) {
        e.preventDefault()
        maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'st', ext: extent.join(',') })
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
