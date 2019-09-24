(function (window, flood) {
  var maps = flood.maps

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
