(function (window, flood) {
  var maps = flood.maps
  var model = flood.model

  maps.createLiveLocationMap('map-live', model.place)
})(window, window.flood)
