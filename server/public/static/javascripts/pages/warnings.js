// Add back button
(function (window, flood) {
  const maps = flood.maps
  const utils = flood.utils
  const model = flood.model
  const mapLive = maps.createLiveMap('map-live')
  const container = mapLive.container
  const map = mapLive.map
  const centre = model.placeCentre
  const bbox = model.placeBbox
  const name = model.placeName

  // Add browser back button
  utils.addBrowserBackButton()

  // Add locator
  container.addLocator(name, centre)

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
        container.show()
        container.setExtentFromBbox(bbox)
        map.showFeatureSet('warnings')
      })
      buttonContainer.append(button)
    }
  }
})(window, window.flood)
