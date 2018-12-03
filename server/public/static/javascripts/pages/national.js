(function (window, flood) {
  var maps = flood.maps

  // Live map
  maps.createLiveMap('map')

  // Outlook map
  if (document.getElementById('map-outlook')) {
    maps.createOutlookMap('map-outlook')
  }
})(window, window.flood)
