(function (window, flood) {
  var ol = window.ol

  function MapContainer (element, options) {
    //
    // Reference to instance
    //

    var self = this

    //
    // Options
    //
    var noop = function () {}

    var defaults = {
      type: 'now',
      featuresUrl: '/get-features', // Must return GeoJSON
      buttonText: 'Show map',
      lonLat: [0, 0],
      zoom: 14,
      minIconResolution: 200,
      hasZoomReset: false,
      hasKey: false,
      hasKeyOpen: false,
      hasSearch: false,
      outlookStartDate: new Date(),
      outlookRiskLevels: [0, 0, 0, 0, 0],
      showLocation: false,
      locationName: '',
      hasTargetAreas: true,
      hasImpacts: false,
      showImpacts: false,
      hasLevels: false,
      showLevels: false,
      activeFeatureId: '',
      onFeatureClick: noop
    }

    self.options = Object.assign({}, defaults, options)

    //
    // Key configuration
    //

    self.configKey = {
      'sections': [
        {
          'items': [
            {
              'id': 'mapView',
              'layers': 'mapView',
              'name': 'Map view',
              'formType': 'radio',
              'group': 'mapView',
              'checked': 'checked'
            },
            {
              'id': 'satteliteView',
              'layers': 'satteliteView',
              'name': 'Satellite view',
              'formType': 'radio',
              'group': 'mapView',
              'checked': 'checked'
            }
          ]
        }
      ]
    }

    //
    // Public properties
    //

    self.isFullScreen = false,
    self.isKeyOpen = false,
    self.selectedFeature = null

    //
    // Public objects
    //

    self.map

    //
    // Map to DOM container elements
    //

    self.elementMap = element
    self.elementMapContainer = element.firstElementChild
    self.elementMapContainerInner = element.firstElementChild.firstElementChild

    //
    // Create additional DOM elements
    //

    self.elementKey,
    self.elementKeyToggle,
    self.elementZoom,
    self.elementZoomReset,
    self.elementFullScreen,
    self.elementShowMap,
    self.elementSearch

    // Private properties
    var sourceConcernAreas,
      sourceImpacts,
      sourceLevels

    // Get query string parameter
    self.getParameterByName = function (name) {
      var v = window.location.search.match(new RegExp('(?:[\?\&]' + name + '=)([^&]+)'))
      return v ? v[1] : null
    }

    // Add or update a querystring parameter
    self.addOrUpdateParameter = function (uri, paramKey, paramVal, fragment) {
      var re = new RegExp('([?&])' + paramKey + '=[^&#]*', 'i')
      if (re.test(uri)) {
        uri = uri.replace(re, '$1' + paramKey + '=' + paramVal)
      } else {
        var separator = /\?/.test(uri) ? '&' : '?'
        uri = uri + separator + paramKey + '=' + paramVal
      }
      return uri + fragment
    }

    // Set fullscreen state
    self.setFullScreen = function () {
      self.elementMap.classList.add('map--fullscreen')
      self.elementFullScreen.classList.add('ol-full-screen-back')
      self.elementFullScreen.title = 'Go back'
      self.isFullScreen = true
      window.activeMap = self
      self.map.updateSize()
    }

    // Remove fullscreen state
    self.removeFullScreen = function () {
      self.closeKey()
      self.elementMap.classList.remove('map--fullscreen')
      self.elementFullScreen.classList.remove('ol-full-screen-back')
      self.elementFullScreen.title = 'Make the map fill the screen'
      self.isFullScreen = false
      window.activeMap = self
      self.map.updateSize()
    }

    // Open key
    self.openKey = function () {
      if (!self.isFullScreen) {
        self.elementFullScreen.click()
      }
      self.elementMap.classList.add('map--key-open')
      self.elementKeyToggle.innerHTML = 'Close'
      self.isKeyOpen = true
      window.activeMap = self
    }

    // Close key
    self.closeKey = function () {
      self.elementMap.classList.remove('map--key-open')
      self.elementKeyToggle.innerHTML = 'Key'
      self.isKeyOpen = false
      window.activeMap = self
    }

    // Show overlay
    self.showOverlay = function (feature, coorindate) {
      // Add class to map
      self.elementMap.classList.add('map--overlay-open')
      // Add feature html
      self.elementOverlayInner.innerHTML = feature.get('html')
      // Set icon resolution class
      var icon = self.elementOverlayInner.querySelector('.ol-overlay__symbol')
      if (icon) {
        if (self.map.getView().getResolution() <= self.options.minIconResolution) {
          icon.classList.add('ol-overlay__symbol--zoomin')
        } else {
          icon.classList.remove('ol-overlay__symbol--zoomin')
        }
      }
      // Create overlay object
      self.overlay = new ol.Overlay({
        element: self.elementOverlayInner,
        positioning: 'bottom-left',
        insertFirst: false,
        className: 'ol-overlay'
      })
      /*
            // Feature is a Point
            if (feature.getGeometry().getType() == 'Point') {
                coorindate = feature.getGeometry().getCoordinates()
                self.overlay.element.classList.add('ol-overlay-offset-pin')
            }
            // Feature is polygon or multip polygon
            else {
                self.overlay.element.classList.remove('ol-overlay-offset-pin')
            }
            // Position overlay
            self.overlay.setPosition([0,0])
            // Add overlay element
            */
      self.overlay.element.style.display = 'block'
      self.map.addOverlay(self.overlay)
      // Hide Outlook day control
      if (self.options.type === 'outlook') {
        self.elementMap.classList.remove('map--outlook-control-open')
      }
    }

    // Hide overlay
    self.hideOverlay = function () {
      // Add class to map
      self.elementMap.classList.remove('map--overlay-open')
      // Disable last selected feature
      if (self.selectedFeature) {
        // Target areas have two point and polygon on different layers
        self.selectedFeature.set('isSelected', false)
        self.selectedFeature = null
      }
      // Remove overlay object
      if (self.overlay) {
        console.log('Remove overlay')
        self.map.removeOverlay(self.overlay)
      }
      // Show Outlook day control
      if (self.options.type === 'outlook') {
        self.elementMap.classList.add('map--outlook-control-open')
      }
    }

    // Main setup method
    self.init = function () {
      //
      // Set flags
      //

      if (self.getParameterByName('view') == 'map-' + self.options.type) {
        self.isFullScreen = true
        window.activeMap = self
      }

      if (self.options.hasKeyOpen) {
        self.isKeyOpen = true
      }

      //
      // Define buttons
      //

      // Show map (mobile only)
      self.elementShowMap = document.createElement('button')
      self.elementShowMap.innerText = self.options.buttonText
      self.elementShowMap.className = 'govuk-button govuk-button--secondary govuk-button--show-map'
      self.elementShowMap.addEventListener('click', function (e) {
        e.preventDefault()
        self.setFullScreen()
        var view = 'map-' + self.options.type
        var state = { 'view': view, 'a': 'b' }
        var url = self.addOrUpdateParameter(location.pathname + location.search, 'view', view, '#' + self.options.type)
        var title = document.title
        history.pushState(state, title, url)
        self.elementFullScreen.classList.add('ol-full-screen-back')
      })
      self.elementMap.parentNode.insertBefore(self.elementShowMap, self.elementMap)

      // Key component
      var keyTemplate = `
            <div class="map-key__container">
                <div class="map-key__heading">
                    <h2 class="map-key__title">Key</h2>
                </div>
                <div class="map-key__features">
                    ${self.configKey.sections.map(section => `
                    <ul class="map-key-features__section">
                        ${section.items.map(item => `
                        <li class="map-key-features__item">
                            ${item.formType == 'radio' ? `
                            <div class="govuk-radios__item govuk-radios__item--map-key">
                                <input class="govuk-radios__input" id="${item.id}" data-layers="${item.layers}" ${item.hasOwnProperty('states') ? `data-states="${item.states}"` : 'data-states=""'} name="${item.group}" type="${item.formType}" ${item.checked}>
                                <label class="govuk-label govuk-radios__label" for="${item.id}">` : ``}
                            ${item.formType == 'checkbox' ? `
                            <div class="govuk-checkboxes__item govuk-checkboxes__item--map-key">
                                <input class="govuk-checkboxes__input" id="${item.id}" data-layers="${item.layers}" ${item.hasOwnProperty('states') ? `data-states="${item.states}"` : 'data-states=""'} name="${item.id}" type="checkbox" value="flood-zones" ${item.checked}>
                                <label class="govuk-label govuk-checkboxes__label" for="${item.id}">` : ``}
                            ${item.formType != 'checkbox' && item.formType != 'radio' ? `
                            <label>` : ``}
                                ${item.hasOwnProperty('backgroundPosition') ? `
                                <span class="govuk-label__inner">
                                    <span class="key-symbol" style="background-position:${item.backgroundPosition};background-size:${item.backgroundSize}" ${item.hasOwnProperty('backgroundPositionOffset') ? `data-style="background-position:${item.backgroundPosition};background-size:${item.backgroundSize}" data-style-offset="background-position:${item.backgroundPositionOffset};background-size:${item.backgroundSize}"` : ''}></span>
                                    ${item.name}
                                </span>` : `${item.name}`}    
                            </label>
                            ${(item.formType == 'checkbox' || item.formType == 'radio') ? `
                            </div>` : ``}
                            ${item.hasOwnProperty('subgroup') ? `
                            <ul class="map-key-features__subgroup">
                                ${item.subgroup.map(subgroupItem => `
                                <li class="map-key-features__subgroup-item">
                                    <span class="map-key-features__item-inner">
                                        <span class="key-symbol" style="background-position:${subgroupItem.backgroundPosition};background-size:${subgroupItem.backgroundSize}" ${subgroupItem.hasOwnProperty('backgroundPositionOffset') ? `data-style="background-position:${subgroupItem.backgroundPosition};background-size:${subgroupItem.backgroundSize}" data-style-offset="background-position:${subgroupItem.backgroundPositionOffset};background-size:${subgroupItem.backgroundSize}"` : ''}></span>
                                        ${subgroupItem.name}
                                    </span>
                                </li>`).join('')}
                            </ul>` : ``}
                        </li>`).join('')}
                    </ul>`).join('')}
                </div>
                <div class="map-key__copyright">
                    © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
                </div>
            </div>`
      self.elementKey = document.createElement('div')
      self.elementKey.innerHTML = keyTemplate
      self.elementKey.className = 'map-key'

      // Key toggle button
      self.elementKeyToggle = document.createElement('button')
      self.elementKeyToggle.innerHTML = 'Key'
      self.elementKeyToggle.title = 'Add or remove information from the map'
      self.elementKeyToggle.className = 'map-key__toggle'
      self.elementKeyToggle.addEventListener('click', function (e) {
        // Toggle key
        if (!self.isKeyOpen) {
          self.openKey()
        } else {
          self.closeKey()
        }
      })

      // Overlay component
      self.elementOverlayInner = document.createElement('div')
      self.elementOverlayInner.classList.add('ol-overlay-inner')

      // Outlook day component
      self.elementOutlook = document.createElement('div')
      self.elementOutlook.className = 'map__outlook-control'
      var elementOutlookInner = document.createElement('div')
      elementOutlookInner.className = 'map__outlook-control__inner'
      for (var i = 0; i < 5; i++) {
        var day = document.createElement('div')
        day.className = 'map__outlook-control__day'
        var button = document.createElement('button')
        button.innerHTML = `
                    ${self.options.outlookStartDate.toLocaleDateString('en-GB', { 'weekday': 'short' })}
                    ${self.options.outlookStartDate.getDate()}
                    <span class="map__outlook-control__icon map__outlook-control__icon--risk-level-${self.options.outlookRiskLevels[i]}"></span>
                `
        button.className = 'map__outlook-control__button'
        button.setAttribute('aria-selected', false)
        button.dataset.order = i + 1
        button.addEventListener('click', function (e) {
          var button = this
          // Set selected state of buttons
          for (var i = 0; i < elementOutlookInner.children.length; i++) {
            elementOutlookInner.children[i].firstChild.setAttribute('aria-selected', false)
          }
          button.setAttribute('aria-selected', true)
          button.focus()
          // Set visibility of features
          sourceConcernAreas.getFeatures().forEach((feature) => {
            if (feature.get('order').toString() == button.dataset.order.toString()) {
              feature.set('isVisible', true)
            } else {
              feature.set('isVisible', false)
            }
          })
          self.map.updateSize()
          e.preventDefault()
        })
        day.appendChild(button)
        elementOutlookInner.appendChild(day)
        // Increment date
        self.options.outlookStartDate.setDate(self.options.outlookStartDate.getDate() + 1)
      }
      // Set initial selected button
      elementOutlookInner.firstChild.firstChild.setAttribute('aria-selected', true)
      self.elementOutlook.appendChild(elementOutlookInner)

      // Zoom buttons
      self.elementZoom = document.createElement('button')
      self.elementZoom.appendChild(document.createTextNode('Zoom'))
      self.elementZoom.className = 'ol-zoom'
      var zoom = new ol.control.Zoom({
        element: self.elementZoom
      })

      // Zoom reset button
      self.elementZoomReset = document.createElement('button')
      self.elementZoomReset.appendChild(document.createTextNode('Zoom reset'))
      self.elementZoomReset.className = 'ol-zoom-reset'
      self.elementZoomReset.setAttribute('title', 'Reset location')
      self.elementZoomReset.addEventListener('click', function (e) {
        e.preventDefault()
      })
      var zoomReset = new ol.control.Control({
        element: self.elementZoomReset
      })

      // Fullscreen button
      self.elementFullScreen = document.createElement('button')
      self.elementFullScreen.className = 'ol-full-screen'
      self.elementFullScreen.title = 'Make the map fill the screen'
      self.elementFullScreen.appendChild(document.createTextNode('Full screen'))
      self.elementFullScreen.addEventListener('click', function (e) {
        e.preventDefault()
        // Fullscreen view
        if (self.isFullScreen) {
          // self.removeFullScreen()
          history.back()
        }
        // Default view
        else {
          self.setFullScreen()
          var view = 'map-' + self.options.type
          var state = { 'view': view, 'a': 'b' }
          var url = self.addOrUpdateParameter(location.pathname + location.search, 'view', view, '#' + self.options.type)
          var title = document.title
          history.pushState(state, title, url)
          this.classList.add('ol-full-screen-back')
        }
      })
      var fullScreen = new ol.control.Control({ // Use fullscreen for HTML Fullscreen API
        element: self.elementFullScreen
      })

      //
      // Setup map
      //

      // Define view object
      //   var view = new ol.View({
      //       center: ol.proj.fromLonLat(options.lonLat),
      //       enableRotation: false,
      //       zoom: options.zoom
      //   })

      //   // Constrain zoom for large scale map
      //   if (self.options.type == 'outlook') {
      //       view.setMinZoom(6)
      //       view.setMaxZoom(8)
      //   }
      var view = self.options.view

      // Add key
      if (self.options.hasKey) {
        self.elementMapContainerInner.appendChild(self.elementKey)
        self.elementKey.insertBefore(self.elementKeyToggle, self.elementKey.firstChild)
      }

      // Add fullscreen control
      if (self.options.hasKey) {
        self.elementKey.prepend(self.elementFullScreen)
      } else {
        self.elementMapContainerInner.prepend(self.elementFullScreen)
      }

      // Add outlook control
      if (self.options.type == 'outlook') {
        self.elementMap.classList.add('map--outlook-control-open')
        self.elementMapContainerInner.appendChild(self.elementOutlook)
      }

      // Add remianing controls
      var customControls = []
      if (self.options.hasZoomReset) {
        customControls.push(zoomReset)
      }
      customControls.push(zoom)
      if (self.options.hasDrawing) {
        customControls.push(deleteFeature)
      }
      var controls = ol.control.defaults({
        zoom: false,
        rotate: false,
        attribution: false
      }).extend(customControls)

      // Add layers to map
      var layers = self.options.layers

      // Render map
      self.map = new ol.Map({
        target: self.elementMapContainerInner,
        controls: controls,
        layers: layers,
        view: view
      })

      // Set and toggle visibility
      if (self.options.hasKey) {
        var checkboxes = self.elementKey.querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach((checkbox) => {
          var layers = checkbox.dataset.layers.split(',')
          var states = []
          if (checkbox.dataset.states.length) {
            states = checkbox.dataset.states.split(',')
          }

          // Show layer or feature if checked
          if (checkbox.checked) {
            // Show layers
            layers.map(function (layer) {
              self[layer].setVisible(true)
            })
          } else if (states.length) {
            layers.map(function (layer) {
              self[layer].setVisible(true)
            })
          }

          // Toggle visibility
          checkbox.addEventListener('click', function (e) {
            layers.map(function (layer) {
              // Toggle feature visibility
              if (states.length) {
                self[layer].getSource().forEachFeature(function (feature) {
                  states.map(function (state) {
                    if (feature.get('state') == state) {
                      feature.get('isVisible') ? feature.set('isVisible', false) : feature.set('isVisible', true)
                    }
                  })
                })
              } else {
                self[layer].getVisible() ? self[layer].setVisible(false) : self[layer].setVisible(true)
              }
            })
          })
        })
      }

      // Set fullscreen before map is rendered
      if (self.isFullScreen) {
        self.setFullScreen()
      }

      // Open key
      if (self.isKeyOpen) {
        self.openKey()
      }

      //
      // Map events
      //

      // Close key or place locator if map is clicked
      self.map.on('click', function (e) {
        // Hide overlay if exists
        self.hideOverlay()
        // Remove feature from selected layer
        // self.layerSelectedFeature.getSource().clear()
        // // Clear selected feature if set
        // if (self.selectedFeature) {
        //   self.selectedFeature.set('isSelected', false)
        //   self.selectedFeature = null
        // }
        // Get mouse coordinates and check for feature
        var feature = self.map.forEachFeatureAtPixel(e.pixel, function (feature) {
          return feature
        })
        // A new feature has been selected
        if (feature) {
          // Target areas have a point and polygon on differet layers
          feature.set('isSelected', true)
          // Store selected feature
          self.selectedFeature = feature
          // Move point feature to selected/top layer
          if (feature.get('geometryType') === 'point') {
            self.layerSelectedFeature.getSource().addFeature(feature)
          }
          // Show overlay
          self.options.onFeatureClick(feature)
          self.showOverlay(self.selectedFeature, e.coordinate)
        } else {
          // No feature has been selected
          // Close key
          if (self.options.hasKey && self.isKeyOpen) {
            self.closeKey()
          }
        }
      })

      // Show cursor when hovering over features
      self.map.on('pointermove', function (e) {
        var mouseCoordInMapPixels = [e.originalEvent.offsetX, e.originalEvent.offsetY]
        // Detect feature at mouse coords
        var hit = self.map.forEachFeatureAtPixel(mouseCoordInMapPixels, function (feature, layer) {
          return true
        })
        if (hit) {
          self.map.getTarget().style.cursor = 'pointer'
        } else {
          self.map.getTarget().style.cursor = ''
        }
      })

      // Toggle fullscreen view on browser history change
      window.onpopstate = function (e) {
        if (window.activeMap) {
          if (e && e.state) {
            window.activeMap.setFullScreen()
          } else {
            window.activeMap.removeFullScreen()
          }
          window.activeMap.map.updateSize()
        }
      }
    }

    self.init()

    return self.map
  }

  var extent = ol.proj.transformExtent([
    -5.75447130203247,
    49.9302711486816,
    1.79968345165253,
    55.8409309387207
  ], 'EPSG:4326', 'EPSG:3857')

  var center = [
    -1.4758,
    52.9219
  ]

  function floodsCentroidStyle (feature, resolution) {
    if (/* feature.get('isVisible') */true) {
      // Defaults
      var strokeColour = 'transparent'
      var fillColour = 'transparent'
      var strokeWidth = 3
      var zIndex = 1
      var source = '/assets/images/icon-map-features-2x.png' // Icon sprite image source
      var offset = [0, 0] // Icon sprite offset
      var image = null
      var text = null
      var opacity = 1
      var lineDash = [0, 0]

      strokeWidth = 3

      if (feature.get('severity') === 1) {
        strokeColour = '#e3000f'
        zIndex = 5
        offset = [0, 1300]
        if (feature.get('isSelected') === true) {
          zIndex = 6
          offset[0] += 100
        }
      } else if (feature.get('severity') === 2) {
        zIndex = 4
        offset = [0, 1400]
        if (feature.get('isSelected') === true) {
          zIndex = 6
          offset[0] += 100
        }
      } else if (feature.get('severity') === 3) {
        fillColour = '#f18700'
        zIndex = 2
        offset = [0, 1500]
        if (feature.get('isSelected') === true) {
          offset[0] += 100
        }
      } else if (feature.get('severity') === 4) {
        fillColour = '#6f777b'
        zIndex = 3
        offset = [0, 1700]
        if (feature.get('isSelected') === true) {
          zIndex = 6
          offset[0] += 100
        }
      }

      // Toggle display of icon/polygon features depending on resolution
      // if (resolution <= self.options.minIconResolution) {
      //   if (feature.get('geometryType') === 'point') {
      //     return null
      //   }
      // } else {
      //   if (feature.get('geometryType') === 'polygon') {
      //     return null
      //   }
      // }

      // Define icon
      image = new ol.style.Icon({
        src: source,
        size: [86, 86],
        anchor: [0.5, 0.75],
        scale: 0.5,
        offset: offset
      })

      // Generate style
      var style = new ol.style.Style({
        fill: new ol.style.Fill({ color: fillColour }),
        stroke: new ol.style.Stroke({
          color: strokeColour,
          width: strokeWidth,
          miterLimit: 2,
          lineJoin: 'round',
          lineDash: lineDash
        }),
        lineDash: lineDash,
        image: image,
        text: text,
        opacity: opacity,
        zIndex: zIndex
      })

      return style
    } else {
      return null
    }
  }

  function stationsStyle (feature, resolution) {
    var featureId = feature.getId()
    if (!featureId) {
      return
    }

    var id = parseInt(featureId.split('stations.')[1], 10)
    var props = feature.getProperties()
    var source = '/assets/images/icon-map-features-2x.png'
    var offset

    if (resolution <= 200) {
      switch (true) {
        case props.status === 'Suspended' || props.status === 'Closed':
          offset = [0, 0]
          break
        case props.atrisk && props.type !== 'C' && props.type !== 'G':
          offset = [0, 300]
          break
        default:
          offset = [0, 100]
          break
      }

      return [
        new ol.style.Style({
          image: new ol.style.Icon({
            src: source,
            size: [86, 86],
            anchor: [0.5, 0.75],
            scale: 0.5,
            offset: offset
          })
        })
      ]
    } else if (resolution > 200) {
      switch (true) {
        case props.status === 'Suspended' || props.status === 'Closed':
          return [
            new ol.style.Style({
              image: new ol.style.Circle({
                fill: new ol.style.Fill({
                  color: '#6e777b'
                }),
                radius: 5,
                stroke: new ol.style.Stroke({
                  color: '#fff'
                })
              })
            })
          ]
        case props.atrisk && props.type !== 'C' && props.type !== 'G':
          return [
            new ol.style.Style({
              image: new ol.style.Circle({
                fill: new ol.style.Fill({
                  color: '#b10d1e'
                }),
                radius: 5,
                stroke: new ol.style.Stroke({
                  color: '#fff'
                })
              })
            })
          ]
        default:
          return [
            new ol.style.Style({
              image: new ol.style.Circle({
                fill: new ol.style.Fill({
                  color: '#006436'
                }),
                radius: 5,
                stroke: new ol.style.Stroke({
                  color: '#fff'
                })
              })
            })
          ]
      }
    }
    // else {
    //   // resolution <= 200
    //   switch (true) {
    //     case props.status === 'Suspended' || props.status === 'Closed':
    //       return [
    //         new ol.style.Style({
    //           image: new ol.style.Icon({
    //             anchor: [0.5, 21],
    //             anchorXUnits: 'fraction',
    //             anchorYUnits: 'pixels',
    //             src: '/public/images/icon-pin-grey-hl.png'
    //           })
    //         })
    //       ]
    //     case props.atrisk && props.type !== 'C' && props.type !== 'G':
    //       return [
    //         new ol.style.Style({
    //           image: new ol.style.Icon({
    //             anchor: [0.5, 21],
    //             anchorXUnits: 'fraction',
    //             anchorYUnits: 'pixels',
    //             src: '/public/images/icon-pin-amber-hl.png'
    //           })
    //         })
    //       ]
    //     default:
    //       return [
    //         new ol.style.Style({
    //           image: new ol.style.Icon({
    //             anchor: [0.5, 21],
    //             anchorXUnits: 'fraction',
    //             anchorYUnits: 'pixels',
    //             src: '/public/images/icon-pin-blue-hl.png'
    //           })
    //         })
    //       ]
    //   }
    // }
  }

  function locationStyle (feature, resolution) {
    if (/* feature.get('isVisible') */true) {
      // Defaults
      var strokeColour = 'transparent'
      var fillColour = 'transparent'
      var strokeWidth = 3
      var zIndex = 1
      var source = '/assets/images/icon-map-features-2x.png' // Icon sprite image source
      var offset = [0, 0] // Icon sprite offset
      var image = null
      var text = null
      var opacity = 1
      var lineDash = [0, 0]

      strokeWidth = 3

      offset = [0,1800]

      // Feature is also slected
      if (feature.get('isSelected') == true) {
          offset[0] += 100
      }


      // Toggle display of icon/polygon features depending on resolution
      // if (resolution <= self.options.minIconResolution) {
      //   if (feature.get('geometryType') === 'point') {
      //     return null
      //   }
      // } else {
      //   if (feature.get('geometryType') === 'polygon') {
      //     return null
      //   }
      // }

      // Define icon 
      image = new ol.style.Icon({
        src: source,
        size: [66, 84],
        anchor: [0.5, 0.92],
        scale: 0.5,
        offset: offset
    })

      // Generate style
      var style = new ol.style.Style({
        fill: new ol.style.Fill({ color: fillColour }),
        stroke: new ol.style.Stroke({
          color: strokeColour,
          width: strokeWidth,
          miterLimit: 2,
          lineJoin: 'round',
          lineDash: lineDash
        }),
        lineDash: lineDash,
        image: image,
        text: text,
        opacity: opacity,
        zIndex: zIndex
      })

      return style
    } else {
      return null
    }
  }

  MapContainer.extent = extent
  MapContainer.center = center
  MapContainer.stationsStyle = stationsStyle
  MapContainer.locationStyle = locationStyle
  MapContainer.floodsCentroidStyle = floodsCentroidStyle
  MapContainer.onFeatureClick = onFeatureClick

  flood.MapContainer = MapContainer
})(window, window.Flood)

function onFeatureClick (feature) {
  var id = feature.getId()
  var props = feature.getProperties()

  if (!props.html) {
    if (id.startsWith('stations')) {
      var stationId = id.substr(9)
      var symbol = 'normal'
      if (props.atrisk) {
        symbol = 'above'
      } else if (props.status === 'Closed' || props.status === 'Suspended') {
        symbol = 'disabled'
      }

      var html = `
              <p class="govuk-!-margin-bottom-2">
              <span class="govuk-body-m govuk-!-font-weight-bold">${props.river}</span><br/>
              <a class="govuk-body-s" href="/station/${stationId}">${props.name}</a>
          </p>
          ${props.status === 'Closed' || props.status === 'Suspended' ? `
          <p class="govuk-body-s">Temporarily out of service</p>
          ` : `
          <p class="govuk-body-s hide">
              <strong class="govuk-font-weight-bold">1.0m</strong> latest recorded<br/>
              <strong class="govuk-font-weight-bold">0.1 to 1.0m</strong> typical range<br/>
              <strong class="govuk-font-weight-bold">1.0m</strong> forecast high
          </p>
          `}
          <span class="ol-overlay__symbol ol-overlay__symbol--${symbol}"></span>
      `
      feature.set('html', html)
    } else if (id.startsWith('flood_warning_alert_centroid')) {
      var html = `
        <p>
            <span class="govuk-body-m govuk-!-font-weight-bold">${props.severity_description}</span><br/>
            <a class="govuk-body-s" href="/target-area/${props.fwa_code}">${props.description}</a>
        </p>
        <span class="ol-overlay__symbol ol-overlay__symbol--${props.severity}"></span>`
      feature.set('html', html)
    }
  }
}
