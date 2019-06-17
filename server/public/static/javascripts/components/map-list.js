(function (window, flood) {
  function MapList (settings, map) {
    var containerEl = document.getElementById(settings.containerId)
    var detailEl = containerEl.firstElementChild

    // Add map view button
    var mapButton = document.createElement('button')
    mapButton.innerText = settings.mapButtonText
    mapButton.className = 'defra-button-map'
    mapButton.addEventListener('click', function (e) {
      e.preventDefault()
      // Set activate layer(s)
      var layers = document.querySelectorAll('.govuk-checkboxes__input')
      layers.forEach(input => {
        // input.checked = input.id === 'stations' ? 'checked' : ''
      })
      // Show map
      map.container.show()
    })
    containerEl.prepend(mapButton)

    // Optionally add list view button
    if (detailEl) {
      detailEl.setAttribute('hidden', 'hidden')
      var listButton = document.createElement('button')
      listButton.innerText = settings.listButtonText
      listButton.className = 'defra-button-list'
      listButton.setAttribute('aria-controls', detailEl.id)
      listButton.setAttribute('aria-expanded', false)
      listButton.addEventListener('click', function (e) {
        if (this.getAttribute('aria-expanded') === 'true') {
          this.setAttribute('aria-expanded', false)
          detailEl.setAttribute('hidden', 'hidden')
        } else {
          this.setAttribute('aria-expanded', true)
          detailEl.removeAttribute('hidden')
        }
      })
      containerEl.prepend(listButton)
    }
  }
  flood.createMapList = function (settings, map) {
    return new MapList(settings, map)
  }
})(window, window.flood)
