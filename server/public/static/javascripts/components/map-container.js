// This file represents the map container.
// It is responsible for initialising the map
// using the ol.view, layers and other options passed.
// It also controls the zoom, full screen controls, responsiveness etc.
// No implementation details specific to a map should be in here.
// This is a generic container that could be reused for LTFRI maps, FMfP etc.
// ***To include a key, include an element with `.map-key__container` in the main inner element.
// To include a key pass its template name as an option

(function (window, flood) {
  var ol = window.ol
  var maps = flood.maps
  var addOrUpdateParameter = flood.utils.addOrUpdateParameter
  var getParameterByName = flood.utils.getParameterByName

  function MapContainer (containerElement, options) {
    var defaults = {
      minIconResolution: 200,
      keyTemplate: ''
    }

    options = Object.assign({}, defaults, options)

    // Container internal properties
    var isKeyOpen = false

    // Create DOM elements
    var mapElement = document.createElement('div')
    mapElement.className = 'defra-map__container'
    containerElement.append(mapElement)

    // Create key
    if (options.keyTemplate !== '') {
      var keyElement = document.createElement('div')
      var keyHtml = window.nunjucks.render(options.keyTemplate)
      keyElement.innerHTML = keyHtml
      keyElement.className = 'map-key'
      // Create key toggle button
      var keyToggleElement = document.createElement('button')
      keyToggleElement.innerHTML = 'Show key'
      keyToggleElement.title = 'Add or remove information from the map'
      keyToggleElement.className = 'defra-map-key__toggle-key-btn'
      keyToggleElement.addEventListener('click', function (e) {
        e.preventDefault()
        isKeyOpen ? closeKey() : openKey()
      })
      mapElement.classList.add('map--has-key')
      mapElement.appendChild(keyElement)
      keyElement.insertBefore(keyToggleElement, keyElement.firstChild)
    }

    // Create overlay
    var overlayInnerElement = document.createElement('div')
    overlayInnerElement.classList.add('ol-overlay-inner')

    // Create zoom buttons
    var zoomButton = document.createElement('button')
    zoomButton.appendChild(document.createTextNode('Zoom'))
    zoomButton.className = 'ol-zoom'
    var zoom = new ol.control.Zoom({
      element: zoomButton
    })

    // Create exit map button
    var hideMapButton = document.createElement('button')
    hideMapButton.className = 'defra-map__exit-map-btn'
    hideMapButton.appendChild(document.createTextNode('Exit map'))
    hideMapButton.addEventListener('click', function (e) {
      // Return focus to original map button
      if (getParameterByName('btn')) {
        var btn = document.getElementById(getParameterByName('btn'))
        btn.focus()
      }
      window.history.back()
      // Todo - need to detect when not to use history back
    })
    mapElement.prepend(hideMapButton)
    // Move focus to exit map button
    hideMapButton.focus()
    /*
    hideMapButton.addEventListener('keyup', function (e) {
      if (e.keyCode === 13 || e.keyCode === 32) {
        this.showMapButton.style.display === 'none' ? this.hideMapButton.focus() : this.showMapButton.focus()
      }
    })
    */

    // Controls - could be moved to instance
    var controls = ol.control.defaults({
      zoom: false,
      rotate: false,
      attribution: false
    }).extend([zoom])

    // Render map
    var map = new ol.Map({
      target: mapElement,
      controls: controls,
      layers: options.layers,
      view: options.view,
      pixelRatio: 1,
      interactions: ol.interaction.defaults({
        altShiftDragRotate: false,
        pinchRotate: false
      })
    })

    // Create a new history entry if show map button pressed
    if (!(getParameterByName('v') === containerElement.id)) {
      // Advance history if button pressed
      var state = { v: containerElement.id }
      var title = document.title
      var url = window.location.pathname + window.location.search
      url = addOrUpdateParameter(url, 'v', containerElement.id)
      if (options.display) {
        // Add any querystring parameters that may have been passed in
        Object.keys(options.display).forEach(function (key, index) {
          url = addOrUpdateParameter(url, key, options.display[key])
        })
      }
      window.history.pushState(state, title, url)
    }

    //
    // Container internal methods
    //

    // Open key
    function openKey () {
      mapElement.classList.add('map--key-open')
      keyToggleElement.innerHTML = 'Close'
      isKeyOpen = true
    }

    // Close key
    function closeKey () {
      mapElement.classList.remove('map--key-open')
      keyToggleElement.innerHTML = 'Show key'
      isKeyOpen = false
    }

    //
    // Container external methods
    //

    // Show overlay
    this.showOverlay = function (feature) {
      // Store selected feature
      // this.selectedFeature = feature
      // Add class to map
      mapElement.classList.add('map--overlay-open')
      // Add feature html
      overlayInnerElement.innerHTML = feature.get('html')

      // Create overlay object
      this.overlay = new ol.Overlay({
        element: overlayInnerElement,
        positioning: 'bottom-left',
        insertFirst: false,
        className: 'ol-overlay'
      })

      this.overlay.element.style.display = 'block'
      map.addOverlay(this.overlay)
    }

    // Hide overlay
    this.hideOverlay = function () {
      // Add class to map
      mapElement.classList.remove('map--overlay-open')
      // Disable last selected feature
      /*
      if (this.selectedFeature) {
        // Target areas have two point and polygon on different layers
        this.selectedFeature.set('isSelected', false)
        this.selectedFeature = null
      }
      */
      // Remove overlay object
      if (this.overlay) {
        map.removeOverlay(this.overlay)
      }
    }

    //
    // Container events
    //

    // Close key or overlay if map is clicked
    map.on('click', function (e) {
      // Hide overlay if exists
      this.hideOverlay()
      if (isKeyOpen) {
        closeKey()
      }
      // Set a short timeout to allow downstream events to fire
      // and set `e.hit`. Hide the key when nothing is clicked (hit).
      /*
      setTimeout(function () {
        if (isKeyOpen) {
          this.closeKey()
        }
      }.bind(this), 100)
      */

      // Disable mouse wheel when point moves away from the map
      /*
      containerElement.addEventListener('mouseout', function (e) {
        mouseWheelZoom.setActive(false)
      })
      */
    }.bind(this))

    // Constrain keyboard focus to components of the map
    mapElement.addEventListener('keydown', function (e) {
      if (mapElement.contains(document.activeElement)) {
        // Tab key
        if (e.keyCode === 9) {
          // Select only elements that can have focus
          var focusableElements = mapElement.querySelectorAll('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
          // Filter to remove any elements that are not currently visible
          var validElements = []
          for (var i = 0; i < focusableElements.length; i++) {
            if (focusableElements[i].offsetParent !== null) {
              validElements.push(focusableElements[i])
            }
          }
          // Set first and last focusable elements
          var firstFocusableElement = validElements[0]
          var lastFocusableElement = validElements[validElements.length - 1]
          // Shift tab (backwards)
          if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              e.preventDefault()
              lastFocusableElement.focus()
            }
          } else { // Tab (forwards)
            if (document.activeElement === lastFocusableElement) {
              e.preventDefault()
              firstFocusableElement.focus()
            }
          }
        }
        // Add map pan (cursor keys)
        // Add map zoom (plus and minus keys)
      }
    })

    // If radio group is in focus disable openlayers keyboard pan
    var keyboardPan
    var hasKeyboardPan = true
    mapElement.addEventListener('keyup', function (e) {
      if (mapElement.contains(document.activeElement)) {
        if (document.activeElement.type === 'radio') {
          map.getInteractions().forEach(function (interaction) {
            if (interaction instanceof ol.interaction.KeyboardPan) {
              keyboardPan = interaction
            }
          }, this)
          if (keyboardPan) {
            map.removeInteraction(keyboardPan)
            hasKeyboardPan = false
          }
          map.removeInteraction(keyboardPan)
        } else {
          if (!hasKeyboardPan) {
            map.addInteraction(keyboardPan)
            hasKeyboardPan = true
          }
        }
      }
    })

    //
    // Container external properties
    //

    this.map = map
    this.mapElement = mapElement
    this.keyElement = keyElement
  }

  maps.MapContainer = MapContainer
})(window, window.flood)
