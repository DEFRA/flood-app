(function (window, flood) {
  var maps = flood.maps

  // Live map
  maps.createLiveNationalMap('map-live')

  // Outlook map
  if (document.getElementById('map-outlook')) {
    maps.createOutlookMap('map-outlook')
  }
})(window, window.flood)
