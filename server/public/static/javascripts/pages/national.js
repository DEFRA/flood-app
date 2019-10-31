(function (window, flood) {
  var maps = flood.maps

  // Outlook map
  const outlookMapContainer = document.getElementById('map-outlook')
  if (outlookMapContainer) {
    const button = document.createElement('button')
    button.innerText = 'View map showing areas of concern'
    button.className = 'defra-button-map govuk-!-margin-bottom-4'
    button.addEventListener('click', function (e) {
      e.preventDefault()
      // Instantiate and show map
      maps.createOutlookMap()
    })
    outlookMapContainer.parentNode.insertBefore(button, outlookMapContainer)
    // Instantiate and show map if querystring parameter
    if (flood.utils.getParameterByName('v') === 'map-outlook') {
      maps.createOutlookMap()
    }
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
