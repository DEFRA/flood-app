(function (window, flood) {
  var ol = window.ol

  function MapContainer (el, options) {
    var noop = function () {}

    var defaults = {
      buttonText: 'Show map',
      minIconResolution: 200,
      hasKey: false,
      onFeatureClick: noop
    }

    this.options = Object.assign({}, defaults, options)

    //
    // Map to DOM container elements
    //
    this.elementMapContainer = el.firstElementChild
    this.mapContainerInnerElement = el.firstElementChild.firstElementChild

    // Show map (mobile only)
    this.showMapButton = document.createElement('button')
    this.showMapButton.innerText = this.options.buttonText
    this.showMapButton.className = 'govuk-button govuk-button--secondary govuk-button--show-map'
    this.showMapButton.addEventListener('click', function (e) {
      e.preventDefault()
      this.setFullScreen()
      this.fullScreenButton.classList.add('ol-full-screen-back')
    }.bind(this))
    el.parentNode.insertBefore(this.showMapButton, el)

    var keyEl = document.getElementById('map-key')
    this.keyElement = document.createElement('div')
    if (keyEl) {
      this.keyElement.appendChild(keyEl)
    }

    this.keyElement.className = 'map-key'

    // Key toggle button
    this.keyToggleElement = document.createElement('button')
    this.keyToggleElement.innerHTML = 'Key'
    this.keyToggleElement.title = 'Add or remove information from the map'
    this.keyToggleElement.className = 'map-key__toggle'
    this.keyToggleElement.addEventListener('click', function (e) {
      // Toggle key
      if (!this.isKeyOpen) {
        this.openKey()
      } else {
        this.closeKey()
      }
    }.bind(this))

    // Overlay component
    this.overlayInnerElement = document.createElement('div')
    this.overlayInnerElement.classList.add('ol-overlay-inner')

    // Zoom buttons
    this.zoomButton = document.createElement('button')
    this.zoomButton.appendChild(document.createTextNode('Zoom'))
    this.zoomButton.className = 'ol-zoom'
    var zoom = new ol.control.Zoom({
      element: this.zoomButton
    })

    // Fullscreen button
    this.fullScreenButton = document.createElement('button')
    this.fullScreenButton.className = 'ol-full-screen'
    this.fullScreenButton.title = 'Make the map fill the screen'
    this.fullScreenButton.appendChild(document.createTextNode('Full screen'))
    this.fullScreenButton.addEventListener('click', function (e) {
      e.preventDefault()
      // Fullscreen view
      if (this.isFullScreen) {
        this.removeFullScreen()
      } else {
        this.setFullScreen()
      }
    }.bind(this))

    var view = this.options.view

    // Add key
    if (this.options.hasKey) {
      this.mapContainerInnerElement.appendChild(this.keyElement)
      this.keyElement.insertBefore(this.keyToggleElement, this.keyElement.firstChild)
    }

    // Add fullscreen control
    if (this.options.hasKey) {
      this.keyElement.prepend(this.fullScreenButton)
    } else {
      this.mapContainerInnerElement.prepend(this.fullScreenButton)
    }

    // Add remianing controls
    var controls = ol.control.defaults({
      zoom: false,
      rotate: false,
      attribution: false
    }).extend([zoom])

    // Add layers to map
    var layers = this.options.layers

    // Render map
    this.map = new ol.Map({
      target: this.mapContainerInnerElement,
      controls: controls,
      layers: layers,
      view: view
    })

    // Set fullscreen before map is rendered
    if (this.isFullScreen) {
      this.setFullScreen()
    }

    // Open key
    if (this.isKeyOpen) {
      this.openKey()
    }

    //
    // Map events
    //

    // Close key or place locator if map is clicked
    this.map.on('click', function (e) {
      // Hide overlay if exists
      this.hideOverlay()
      // Get mouse coordinates and check for feature
      var feature = this.map.forEachFeatureAtPixel(e.pixel, function (feature) {
        return feature
      })
      // A new feature has been selected
      if (feature) {
        // Target areas have a point and polygon on differet layers
        feature.set('isSelected', true)
        // Store selected feature
        this.selectedFeature = feature
        // Move point feature to selected/top layer
        if (feature.get('geometryType') === 'point') {
          this.layerSelectedFeature.getSource().addFeature(feature)
        }

        // Show overlay
        this.options.onFeatureClick(feature)
        this.showOverlay(this.selectedFeature, e.coordinate)
      } else {
        // No feature has been selected
        // Close key
        if (this.options.hasKey && this.isKeyOpen) {
          this.closeKey()
        }
      }
    }.bind(this))

    // Show cursor when hovering over features
    // this.map.on('pointermove', function (e) {
    //   var mouseCoordInMapPixels = [e.originalEvent.offsetX, e.originalEvent.offsetY]
    //   // Detect feature at mouse coords
    //   var hit = this.map.forEachFeatureAtPixel(mouseCoordInMapPixels, function (feature, layer) {
    //     return true
    //   })
    //   if (hit) {
    //     this.map.getTarget().style.cursor = 'pointer'
    //   } else {
    //     this.map.getTarget().style.cursor = ''
    //   }
    // }.bind(this))

    // Set fullscreen state
    this.setFullScreen = function () {
      el.classList.add('map--fullscreen')
      this.fullScreenButton.classList.add('ol-full-screen-back')
      this.fullScreenButton.title = 'Go back'
      this.isFullScreen = true
      this.map.updateSize()
    }

    // Remove fullscreen state
    this.removeFullScreen = function () {
      this.closeKey()
      el.classList.remove('map--fullscreen')
      this.fullScreenButton.classList.remove('ol-full-screen-back')
      this.fullScreenButton.title = 'Make the map fill the screen'
      this.isFullScreen = false
      this.map.updateSize()
    }

    // Open key
    this.openKey = function () {
      if (!this.isFullScreen) {
        this.fullScreenButton.click()
      }
      el.classList.add('map--key-open')
      this.keyToggleElement.innerHTML = 'Close'
      this.isKeyOpen = true
    }

    // Close key
    this.closeKey = function () {
      el.classList.remove('map--key-open')
      this.keyToggleElement.innerHTML = 'Key'
      this.isKeyOpen = false
    }

    // Show overlay
    this.showOverlay = function (feature, coorindate) {
      // Add class to map
      el.classList.add('map--overlay-open')
      // Add feature html
      this.overlayInnerElement.innerHTML = feature.get('html')
      // Set icon resolution class
      var icon = this.overlayInnerElement.querySelector('.ol-overlay__symbol')
      if (icon) {
        if (this.map.getView().getResolution() <= this.options.minIconResolution) {
          icon.classList.add('ol-overlay__symbol--zoomin')
        } else {
          icon.classList.remove('ol-overlay__symbol--zoomin')
        }
      }
      // Create overlay object
      this.overlay = new ol.Overlay({
        element: this.overlayInnerElement,
        positioning: 'bottom-left',
        insertFirst: false,
        className: 'ol-overlay'
      })

      this.overlay.element.style.display = 'block'
      this.map.addOverlay(this.overlay)
    }

    // Hide overlay
    this.hideOverlay = function () {
      // Add class to map
      el.classList.remove('map--overlay-open')
      // Disable last selected feature
      if (this.selectedFeature) {
        // Target areas have two point and polygon on different layers
        this.selectedFeature.set('isSelected', false)
        this.selectedFeature = null
      }
      // Remove overlay object
      if (this.overlay) {
        this.map.removeOverlay(this.overlay)
      }
    }
  }

  flood.MapContainer = MapContainer
})(window, window.Flood)
