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

  // Application utilities - perhaps should be somewhere else

  function getParameterByName (name) {
    var v = window.location.search.match(new RegExp('(?:[\?\&]' + name + '=)([^&]+)'))
    return v ? v[1] : null
  }

  // Add or update a querystring parameter
  function addOrUpdateParameter (uri, paramKey, paramVal, fragment = '') {
    var re = new RegExp('([?&])' + paramKey + '=[^&#]*', 'i')
    if (re.test(uri)) {
      uri = uri.replace(re, '$1' + paramKey + '=' + paramVal)
    } else {
      var separator = /\?/.test(uri) ? '&' : '?'
      uri = uri + separator + paramKey + '=' + paramVal
    }
    return uri + fragment
  }

  function MapContainer (el, options) {
    var defaults = {
      buttonText: 'Show map',
      progressive: false,
      minIconResolution: 200,
      keyTemplate: ''
    }

    this.options = Object.assign({}, defaults, options)

    //
    // Map to DOM container elements
    //

    this.element = el.firstElementChild
    this.mapContainerInnerElement = el.firstElementChild.firstElementChild

    // Show map (mobile only)
    this.showMapButton = document.createElement('button')
    this.showMapButton.innerText = this.options.buttonText
    this.showMapButton.className = 'govuk-button govuk-button--secondary govuk-button--show-map'
    this.showMapButton.addEventListener('click', function (e) {
      e.preventDefault()
      /*
      this.setFullScreen()
      this.fullScreenButton.classList.add('ol-full-screen-back')
      */
      this.setFullScreen()
      var state = { 'view': el.id }
      var title = document.title
      var url = addOrUpdateParameter(window.location.pathname + window.location.search, 'view', el.id)
      window.history.pushState(state, title, url)
    }.bind(this))
    el.parentNode.parentNode.insertBefore(this.showMapButton, el.parentNode)

    var hasKey = false
    // Experimental adding key via client side template

    if (this.options.keyTemplate !== '') {
      var keyHtml = window.nunjucks.render(this.options.keyTemplate)
      hasKey = true
      this.keyElement = document.createElement('div')
      this.keyElement.innerHTML = keyHtml
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
    }

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
      /*
      if (this.isFullScreen) {
        this.removeFullScreen()
      } else {
        this.setFullScreen()
      }
      */
      if (this.isFullScreen) {
        window.history.back()
      } else {
        this.setFullScreen()
        var state = { 'view': el.id }
        var title = document.title
        var url = addOrUpdateParameter(window.location.pathname + window.location.search, 'view', el.id)
        window.history.pushState(state, title, url)
        e.target.classList.add('ol-full-screen-back')
      }
    }.bind(this))

    var view = this.options.view

    // Add key
    if (hasKey) {
      el.classList.add('map--has-key')
      this.mapContainerInnerElement.appendChild(this.keyElement)
      this.keyElement.insertBefore(this.keyToggleElement, this.keyElement.firstChild)
    }

    // Add fullscreen control
    if (hasKey) {
      this.keyElement.prepend(this.fullScreenButton)
    } else {
      this.mapContainerInnerElement.prepend(this.fullScreenButton)
    }

    // Add remaining controls
    var controls = ol.control.defaults({
      zoom: false,
      rotate: false,
      attribution: false
    }).extend([zoom])

    // Add layers to map
    var layers = this.options.layers

    // Render map
    var map = new ol.Map({
      target: this.mapContainerInnerElement,
      controls: controls,
      layers: layers,
      view: view,
      interactions: ol.interaction.defaults({
        mouseWheelZoom: false
      })
    })

    // Add mouse wheel zoom interaction
    var mouseWheelZoom = new ol.interaction.MouseWheelZoom()
    map.addInteraction(mouseWheelZoom)

    this.map = map

    // Set fullscreen before map is rendered
    /*
    if (this.isFullScreen) {
      this.setFullScreen()
    }
    */

    // Open key
    if (this.isKeyOpen) {
      this.openKey()
    }

    // Show map progressive disclosure (desktop only)
    if (this.options.progressive) {
      this.progressiveButton = document.createElement('button')
      this.progressiveButton.innerText = this.options.buttonText
      this.progressiveButton.className = 'govuk-button govuk-button--progressive'
      this.progressiveButton.setAttribute('aria-pressed', false)
      this.progressiveButton.addEventListener('click', function (e) {
        e.preventDefault()
        if (this.getAttribute('aria-pressed') === 'true') {
          this.setAttribute('aria-pressed', false)
          el.parentNode.setAttribute('aria-expanded', false)
        } else {
          this.setAttribute('aria-pressed', true)
          el.parentNode.setAttribute('aria-expanded', true)
        }
        this.focus()
        this.updateSize()
      })
      el.parentNode.parentNode.insertBefore(this.progressiveButton, el.parentNode)
      // Tablet upwards only
      if (window.matchMedia && window.matchMedia('(min-width: 40.0625em)').matches) {
        el.parentNode.setAttribute('aria-expanded', false)
      }
    }

    //
    // Map events
    //

    // Close key or overlay if map is clicked
    map.on('click', function (e) {
      // Re-enable mouse wheel scroll
      // mouseWheelZoom.setActive(true)

      // Hide overlay if exists
      this.hideOverlay()

      // Set a short timeout to allow downstream events to fire
      // and set `e.hit`. Hide the key when nothing is clicked (hit).
      setTimeout(function () {
        if (hasKey && this.isKeyOpen) {
          this.closeKey()
        }
      }.bind(this), 100)
    }.bind(this))

    // Disable mouse wheel when point moves away from the map
    el.addEventListener('mouseout', function (e) {
      mouseWheelZoom.setActive(false)
    })

    // Set fullscreen state
    this.setFullScreen = function () {
      el.classList.add('map--fullscreen')
      this.fullScreenButton.classList.add('ol-full-screen-back')
      this.fullScreenButton.title = 'Go back'
      this.fullScreenButton.focus()
      this.isFullScreen = true
      map.updateSize()
    }

    // Remove fullscreen state
    this.removeFullScreen = function () {
      el.classList.remove('map--fullscreen')
      this.fullScreenButton.classList.remove('ol-full-screen-back')
      this.fullScreenButton.title = 'Make the map fill the screen'
      this.isFullScreen = false
      map.updateSize()
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
    this.showOverlay = function (feature) {
      feature.set('isSelected', true)
      // Store selected feature
      this.selectedFeature = feature
      // Add class to map
      el.classList.add('map--overlay-open')
      // Add feature html
      this.overlayInnerElement.innerHTML = feature.get('html')
      // Set icon resolution class
      var icon = this.overlayInnerElement.querySelector('.ol-overlay__symbol')
      if (icon) {
        if (map.getView().getResolution() <= this.options.minIconResolution) {
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
      map.addOverlay(this.overlay)
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
        map.removeOverlay(this.overlay)
      }
    }

    // Set fullscreen state
    if (getParameterByName('view') === el.id) {
      this.setFullScreen()
    }

    // Toggle fullscreen view on browser history change
    window.addEventListener('popstate', function (e) { 
      if (e && e.state && getParameterByName('view') === el.id) {
        this.setFullScreen()
      } else {
        this.removeFullScreen()
      }
    }.bind(this))

    // Constrain keyboard focus
    this.element.addEventListener('keydown', function(e) {
      if (e.keyCode === 9 && this.isFullScreen) {
        // Select only elements that can have focus
        var focusableElements = this.element.querySelectorAll('button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        // Filter to remove any elements that are not currently visible
        var validElements = []
        for (i = 0; i < focusableElements.length; i++) {
          if (focusableElements[i].offsetParent !== null) {
            validElements.push(focusableElements[i])
          }
        }
        // Set first and last element
        var firstFocusableElement = validElements[0]
        var lastFocusableElement = validElements[validElements.length - 1]
        // Shift tab (backwards)
        if (e.shiftKey) {            
          if (document.activeElement === firstFocusableElement) {
            e.preventDefault()
            lastFocusableElement.focus()
          }
        }
        // Tab (forwards) 
        else {
          if (document.activeElement === lastFocusableElement) {
            e.preventDefault()
            firstFocusableElement.focus()
          }
        }
      }
    }.bind(this))
  }

  maps.MapContainer = MapContainer
})(window, window.flood)
