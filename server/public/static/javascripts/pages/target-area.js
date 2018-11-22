(function (window, flood) {
  var maps = flood.maps
  var model = flood.model
  var createMap = maps.createMap

  createMap('map', model.place)
})(window, window.flood)
