(function (window, flood) {
  var ol = window.ol
  var maps = flood.maps
  var MapContainer = maps.MapContainer

  function Map (containerId, place) {
    // ol.View
    var view = new ol.View({
      zoom: place ? 11 : 6,
      minZoom: 6,
      maxZoom: 14,
      extent: maps.extent,
      center: ol.proj.transform(place ? place.center : maps.center, 'EPSG:4326', 'EPSG:3857')
    })

    // ol.Layers
    var road = maps.layers.road()
    var satellite = maps.layers.satellite()
    var floodsSevere = maps.layers.floodsSevere()
    var floodsWarning = maps.layers.floodsWarning()
    var floodsAlert = maps.layers.floodsAlert()
    var floodsNotInForce = maps.layers.floodsNotInForce()
    var stations = maps.layers.stations()
    var floodCentroids = maps.layers.floodCentroids()
    var floodPolygon = maps.layers.floodPolygon()

    // MapContainer options
    var options = {
      buttonText: 'Map showing current risk',
      view: view,
      layers: [
        road,
        satellite,
        floodsNotInForce,
        floodsAlert,
        floodsWarning,
        floodsSevere,
        floodPolygon,
        stations,
        floodCentroids
      ],
      onFeatureClick: maps.onFeatureClick
    }

    // Localised
    if (place) {
      options.layers.push(maps.layers.location(place.name, place.center))
    }

    // Create MapContainer
    var containerEl = document.getElementById(containerId)
    var container = new MapContainer(containerEl, options)

    // Handle key interactions
    var keyForm = container.keyElement.querySelector('form')

    options.setFloodsVisibility = function (severity, visible) {
      // flood centroids
      floodCentroids.getSource().forEachFeature(function (feature) {
        if (severity.indexOf(feature.get('severity')) > -1) {
          feature.setStyle(visible ? null : new ol.style.Style({}))
        }
      })
      // flood polygons
      severity.forEach(function (severity) {
        switch (severity) {
          case 1:
            floodsSevere.setVisible(visible)
            break
          case 2:
            floodsWarning.setVisible(visible)
            break
          case 3:
            floodsAlert.setVisible(visible)
            break
          case 4:
            floodsNotInForce.setVisible(visible)
            break
          default:
        }
      })
    }

    options.setFloodsOpacity = function (opacity) {
      floodsSevere.setOpacity(opacity)
      floodsWarning.setOpacity(opacity)
      floodsAlert.setOpacity(opacity)
      floodsNotInForce.setOpacity(opacity)
    }

    if (keyForm) {
      keyForm.addEventListener('change', function (e) {
        const target = e.target
        const name = target.name

        switch (name) {
          case 'baseLayer': {
            if (target.value === 'mapView') {
              road.setVisible(true)
              satellite.setVisible(false)
            } else {
              road.setVisible(false)
              satellite.setVisible(true)
            }
            break
          }
          case 'riverLevels': {
            stations.setVisible(target.checked)
            break
          }
          case 'floodWarnings': {
            options.setFloodsVisibility([1, 2], target.checked)
            break
          }
          case 'floodAlerts': {
            options.setFloodsVisibility([3], target.checked)
            break
          }
          case 'floodExpired': {
            options.setFloodsVisibility([4], target.checked)
            break
          }
        }
      })
    }

    if (place && place.bbox) {
      var searchExtent = ol.proj.transformExtent(place.bbox, 'EPSG:4326', 'EPSG:3857')

      container.map.getView().fit(searchExtent, {
        maxZoom: 16,
        size: container.map.getSize()
      })
    }

    this.map = container.map
    this.container = container
  }

  maps.createMap = function (containerId, place) {
    return new Map(containerId, place)
  }
})(window, window.flood)
