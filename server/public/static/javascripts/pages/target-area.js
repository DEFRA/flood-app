// Add back button
(function (window, flood) {
  const maps = flood.maps
  const utils = flood.utils
  const model = flood.model
  const mapLive = maps.createLiveMap('map-live')
  const container = mapLive.container
  const map = mapLive.map
  const geometry = model.area.geom

  // Add browser back button
  utils.addBrowserBackButton()

  // Add map button and setup map
  // Create map button
  const buttonContainer = document.getElementById('mapButtonContainer')
  if (buttonContainer) {
    const button = document.createElement('button')
    button.innerText = 'View map of the flood risk area'
    button.className = 'defra-button-map govuk-!-margin-bottom-4'
    button.addEventListener('click', function (e) {
      e.preventDefault()
      container.show()
      container.setExtentFromGeometry(geometry)
      map.showFeatureSet('warnings')
    })
    buttonContainer.append(button)
  }
})(window, window.flood)
