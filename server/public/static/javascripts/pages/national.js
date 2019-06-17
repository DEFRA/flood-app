(function (window, flood) {
  var maps = flood.maps

  // Live map
  var mapLive = maps.createLiveMap('map-live')

  if (document.getElementById('map-list-warnings')) {
    flood.createMapList({
      'containerId': 'map-list-warnings',
      'listButtonText': 'View alerts and warnings',
      'mapButtonText': 'Map'
    }, mapLive)
  }

  // Outlook map
  if (document.getElementById('map-outlook')) {
    maps.createOutlookMap('map-outlook')
  }
  
})(window, window.flood)
