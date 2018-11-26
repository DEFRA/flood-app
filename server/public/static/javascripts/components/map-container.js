(function (window, flood) {
  var ol = window.ol
  var maps = flood.maps

  function MapContainer (el, options) {
    var noop = function () {}

    var defaults = {
      buttonText: 'Show map',
      minIconResolution: 200,
      onFeatureClick: noop
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
      this.setFullScreen()
      this.fullScreenButton.classList.add('ol-full-screen-back')
    }.bind(this))
    el.parentNode.insertBefore(this.showMapButton, el)

    var hasKey = false
    var keyEl = this.mapContainerInnerElement.querySelector('.map-key__container')
    if (keyEl) {
      hasKey = true
      this.keyElement = document.createElement('div')
      this.keyElement.appendChild(keyEl)
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
      if (this.isFullScreen) {
        this.removeFullScreen()
      } else {
        this.setFullScreen()
      }
    }.bind(this))

    var view = this.options.view

    // Add key
    if (hasKey) {
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
      view: view
    })

    this.map = map

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
    map.on('click', function (e) {
      // Hide overlay if exists
      this.hideOverlay()
      // Get mouse coordinates and check for feature if not the highlighted flood polygon
      var feature = map.forEachFeatureAtPixel(e.pixel, function (feature) {
        return feature
      }, {
        layerFilter: function (layer) {
          return layer.get('ref') !== 'flood-polygon'
        }
      })

      // A new feature has been selected
      if (feature) {
        // Target areas have a point and polygon on different layers
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

        // Clear out pre selected polygon
        this.setFloodPolygonSource()
      } else {
        var layer = this.getFloodLayer(e.pixel)
        if (layer) {
          var url = layer.getSource().getGetFeatureInfoUrl(e.coordinate, view.getResolution(), 'EPSG:3857', {
            INFO_FORMAT: 'application/json',
            FEATURE_COUNT: 1,
            propertyName: 'fwa_key,fwa_code,severity,severity_description,description,geom'
          })
          if (url) {
            flood.utils.xhr(url, function (err, json) {
              if (err) {
                console.error(err)
              }

              var feature = (new ol.format.GeoJSON()).readFeatures(json, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
              })[0]

              // Add polygon to selection layer
              this.setFloodPolygonSource(new ol.source.Vector({
                features: [feature],
                format: new ol.format.GeoJSON()
              }))

              this.selectedFeature = feature
              this.options.onFeatureClick(feature)
              this.showOverlay(this.selectedFeature, e.coordinate)
            }.bind(this))
          }
        } else {
          // No feature has been selected
          // Close key
          if (hasKey && this.isKeyOpen) {
            this.closeKey()
          }
          this.setFloodPolygonSource()
        }
      }
    }.bind(this))

    // Show cursor when hovering over features
    map.on('pointermove', function (e) {
      var mouseCoordInMapPixels = [e.originalEvent.offsetX, e.originalEvent.offsetY]
      // Detect vector feature at mouse coords
      var hit = map.forEachFeatureAtPixel(mouseCoordInMapPixels, function (feature, layer) {
        return true
      })
      // Detect wms image at mouse coords
      if (!hit) {
        hit = this.getFloodLayer(mouseCoordInMapPixels)
      }
      if (hit) {
        map.getTarget().style.cursor = 'pointer'
      } else {
        map.getTarget().style.cursor = ''
      }
    }.bind(this))

    // detects if pixel is over a wms image and returns the layer
    this.getFloodLayer = function (pixel) {
      return map.forEachLayerAtPixel(pixel, function (layer) {
        return layer
      }, {
        layerFilter: function (layer) {
          var ref = layer.get('ref')
          return (ref && ref.indexOf('floods-') > -1)
        }
      })
    }

    // Sets the source of selected warning polygon
    this.setFloodPolygonSource = function (source) {
      map.getLayers().forEach(function (layer) {
        if (layer.get('ref') === 'flood-polygon') {
          layer.setSource(source)
        }
      })
    }

    // Set fullscreen state
    this.setFullScreen = function () {
      el.classList.add('map--fullscreen')
      this.fullScreenButton.classList.add('ol-full-screen-back')
      this.fullScreenButton.title = 'Go back'
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
    this.showOverlay = function (feature, coordinate) {
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

    // TODO: this should be performed dynamically from the key selection, or once cookie is implemented
    map.once('rendercomplete', function (event) {
      options.setFloodsVisibility([4], false)
    })

    // Reactions based on pan/zoom change on map
    map.on('moveend', function (event) {
      // Update layer opacity setting for different map resolutions
      var resolution = map.getView().getResolution()
      var layerOpacity = 1
      if (resolution > 20) {
        layerOpacity = 1
      } else if (resolution > 10) {
        layerOpacity = 0.8
      } else if (resolution > 5) {
        layerOpacity = 0.6
      } else {
        layerOpacity = 0.4
      }
      options.setFloodsOpacity(layerOpacity)

      // Key icons
      if (resolution <= this.options.minIconResolution) {
        // Key polygons
        this.mapContainerInnerElement.querySelectorAll('[data-style]').forEach((symbol) => {
          symbol.style = symbol.getAttribute('data-style-offset')
        })
      } else {
        // Key icons
        this.mapContainerInnerElement.querySelectorAll('[data-style]').forEach((symbol) => {
          symbol.style = symbol.getAttribute('data-style')
        })
      }
    }.bind(this))
  }

  maps.MapContainer = MapContainer
})(window, window.flood)
