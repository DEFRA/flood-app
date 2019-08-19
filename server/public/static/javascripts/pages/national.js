(function (window, flood) {
  var maps = flood.maps

  // Live map
  // var mapLive = maps.createLiveMap('map-live')

  /*
  // Ultimately needs to be in the MapContainer
  function showLayer (map, state) {
    // Set layers in key
    var layers = document.querySelectorAll('.govuk-checkboxes__input')
    layers.forEach(input => {
      switch (input.id) {
        case 'severeFloodWarnings':
        case 'floodWarnings':
        case 'floodAlerts':
          input.checked = state === 'warnings' ? 'checked' : ''
          break
        case 'impacts':
          input.checked = state === 'impacts' ? 'checked' : ''
          break
        case 'stations':
          input.checked = state === 'stations' ? 'checked' : ''
          break
        case 'rain':
          input.checked = state === 'rain' ? 'checked' : ''
      }
    })
    // Set layers and/or features on map
    map.getLayers().forEach(function (layer) {      
      console.log(layer.get('ref'))
      switch (layer.get('ref')) {
        case 'floods-alert':
        case 'floods-warning':
        case 'floods-severe':
          state === 'warnings' ? layer.setVisible(true) : layer.setVisible(false)
          break
        case 'flood-centroids':
          if (state === 'warnings') {
            layer.getSource().forEachFeature(function (feature) {feature.setStyle(null)})
            layer.setVisible(true)
          } else {
            layer.getSource().forEachFeature(function (feature) {feature.setStyle(new ol.style.Style({}))})
            layer.setVisible(false)
          }
          break
        case 'impacts': 
          state === 'impacts' ? layer.setStyle(maps.styles.impacts) : layer.setStyle(new ol.style.Style({}))
          break
        case 'stations':
          state === 'stations' ? layer.setStyle(maps.styles.stations) : layer.setStyle(new ol.style.Style({}))
          break
        case 'rain': 
          state === 'rain' ? layer.setStyle(maps.styles.rain) : layer.setStyle(new ol.style.Style({}))
          break
      }
    })
  }

  if (document.getElementById('map-list-warnings')) {
    // Create map list
    var mapListWarning = flood.createMapList(document.getElementById('map-list-warnings'), {
      'listButtonText': 'View alerts and warnings',
      'mapButtonText': 'Map'
    })
    // Add map event
    mapListWarning.mapButton.addEventListener('click', function (e) {
      e.preventDefault()
      // Show map
      mapLive.container.show()
      showLayer(mapLive.map, 'warnings')
    })
  }
  */

  // Outlook map
  if (document.getElementById('map-outlook')) {
    maps.createOutlookMap('map-outlook')
  }

  // Warning enhancement
  var warningLinks = document.querySelectorAll('.defra-warning-flood a')
  for (var i = 0; i < warningLinks.length; ++i) {
    var href = warningLinks[i].href
    var warning = warningLinks[i].closest('.defra-warning-flood')
    warning.addEventListener('mouseenter', function (e) {
      this.classList.add('defra-warning-flood--hover')
    })
    warning.addEventListener('mouseleave', function (e) {
      this.classList.remove('defra-warning-flood--hover')
    })
    warning.addEventListener('click', function (e) {
      window.location = href
    })
  }
})(window, window.flood)
