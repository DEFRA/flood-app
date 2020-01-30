// Add back button
(function (window, flood) {
  const ol = window.ol
  const maps = flood.maps
  const utils = flood.utils
  const model = flood.model

  // Add browser back button
  utils.addBrowserBackButton()

  // Create LiveMap if querystring is present
  if (utils.getParameterByName('v') === 'map-live') {
    maps.createLiveMap('map-live')
  }
  // Create LiveMap if show map button pressed
  var mapContainer = document.getElementById('map-live')
  if (mapContainer) {
    // Get extent LatLon from target area
    var cooridnates = ol.proj.fromLonLat(JSON.parse(model.area.geom).coordinates, 'EPSG:4326', 'EPSG:3857')
    var feature = new ol.Feature({ geometry: new ol.geom.MultiPolygon(cooridnates) })
    var extent = feature.getGeometry().getExtent()
    extent = extent.map(function (x) { return Number(x.toFixed(6)) })
    // Create map button with parameters
    const button = document.createElement('button')
    button.id = 'map-btn'
    button.className = 'defra-button-map govuk-!-margin-bottom-4'
    button.innerText = `View map of the ${model.severity && model.severity.id < 4 ? 'area affected' : 'target area'}`
    button.addEventListener('click', function (e) {
      e.preventDefault()
      maps.createLiveMap('map-live', { btn: 'map-btn', lyr: 'ts,tw,ta', fid: 'flood.' + model.area.code.toLowerCase(), ext: extent.join(',') })
    })
    mapContainer.parentNode.insertBefore(button, mapContainer)
  }
  // Create LiveMap if history changes
  window.addEventListener('popstate', function (e) {
    if (mapContainer.firstChild) {
      mapContainer.removeChild(mapContainer.firstChild)
    }
    if (e && e.state) {
      maps.createLiveMap('map-live')
    }
  })
})(window, window.flood)
