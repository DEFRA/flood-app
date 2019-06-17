(function (window, flood) {
  var maps = flood.maps
  var model = flood.model

  var mapLive = maps.createLiveMap('map-live', model.place)

  if (document.getElementById('map-list-warnings')) {
    flood.createMapList({
      'containerId': 'map-list-warnings',
      'listButtonText': 'View alerts and warnings',
      'mapButtonText': 'Map'
    }, mapLive)
  }

  if (document.getElementById('map-list-impacts')) {
    flood.createMapList({
      'containerId': 'map-list-impacts',
      'listButtonText': 'View previous flood impacts',
      'mapButtonText': 'Map'
    }, mapLive)
  }

  if (document.getElementById('map-list-levels')) {
    flood.createMapList({
      'containerId': 'map-list-levels',
      'listButtonText': 'View river and sea levels',
      'mapButtonText': 'Map'
    }, mapLive)
  }

})(window, window.flood)
