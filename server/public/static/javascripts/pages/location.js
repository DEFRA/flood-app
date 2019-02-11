(function (window, flood) {
  var maps = flood.maps
  var model = flood.model

  maps.createLiveLocationMap('map', model.place)
})(window, window.flood)
