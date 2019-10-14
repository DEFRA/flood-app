(function (window, maps) {
  var ol = window.ol
  var layers = {}

  function road () {
    return new ol.layer.Tile({
      ref: 'road',
      source: new ol.source.BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'RoadOnDemand'
      }),
      // source: new ol.source.OSM(),
      visible: true,
      zIndex: 0
    })
  }

  function satellite () {
    return new ol.layer.Tile({
      ref: 'satellite',
      source: new ol.source.BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false
    })
  }

  /*
  function floodPolygonsSevere () {
    return new ol.layer.Image({
      ref: 'floods-severe',
      maxResolution: 200,
      source: new ol.source.ImageWMS({
        url: '/ows?service=wms',
        serverType: 'geoserver',
        params: {
          'LAYERS': 'flood_warning_alert',
          'CQL_FILTER': 'severity = 1'
        }
      }),
      visible: false
    })
  }

  function floodPolygonsWarning () {
    return new ol.layer.Image({
      ref: 'floods-warning',
      maxResolution: 200,
      source: new ol.source.ImageWMS({
        url: '/ows?service=wms',
        serverType: 'geoserver',
        params: {
          'LAYERS': 'flood_warning_alert',
          'CQL_FILTER': 'severity = 2'
        }
      }),
      visible: false
    })
  }

  function floodPolygonsAlert () {
    return new ol.layer.Image({
      ref: 'floods-alert',
      maxResolution: 200,
      source: new ol.source.ImageWMS({
        url: '/ows?service=wms',
        serverType: 'geoserver',
        params: {
          'LAYERS': 'flood_warning_alert',
          'CQL_FILTER': 'severity = 3'
        }
      }),
      visible: false
    })
  }
  */

  /*
  function floodPolygonsNotInForce () {
    return new ol.layer.Image({
      ref: 'floods-notinforce',
      maxResolution: 200,
      source: new ol.source.ImageWMS({
        url: '/ows?service=wms',
        serverType: 'geoserver',
        params: {
          'LAYERS': 'flood_warning_alert',
          'CQL_FILTER': 'severity = 4'
        }
      }),
      visible: false
    })
  }
  */

  /*
  function floodPolygon () {
    return new ol.layer.Vector({
      ref: 'flood-polygon',
      maxResolution: 200,
      style: maps.styles.floodPolygon
    })
  }
  */

  function polygons () {
    return new ol.layer.Vector({
      ref: 'polygons',
      maxResolution: 200,
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        loader: function (extent, resolution, projection) {
          var source = this
          var proj = projection.getCode()
          var url = '/ows?service=wfs&' +
              'version=2.0.0&request=GetFeature&typename=flood:flood_warning_alert&' +
              'outputFormat=application/json&srsname=' + proj + '&' +
              'bbox=' + extent.join(',') + ',' + proj
          var xhr = new XMLHttpRequest ()
          xhr.open('GET', url)
          var onError = function () {
            source.removeLoadedExtent(extent)
          }
          xhr.onerror = onError
          xhr.onload = function () {
            if (xhr.status === 200) {
              source.addFeatures(source.getFormat().readFeatures(xhr.responseText))
              // Temporary fix to create usable id as per other features
              source.getFeatures().forEach((feature) => {
                feature.setId('flood.' + feature.get('fwa_key'))
              })
            } else {
              onError()
            }
          }
          xhr.send()
        },
        strategy: ol.loadingstrategy.bbox
      }),
      style: maps.styles.floods
    })
  }

  function floods () {
    return new ol.layer.Vector({
      ref: 'floods',
      minResolution: 200,
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert_centroid&maxFeatures=10000&outputFormat=application/json'
      }),
      style: maps.styles.floods
    })
  }

  function stations () {
    return new ol.layer.Vector({
      ref: 'stations',
      title: 'stations',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:stations&maxFeatures=10000&outputFormat=application/json&srsName=EPSG:4326'
      }),
      style: new ol.style.Style({})
    })
  }

  function rain () {
    return new ol.layer.Vector({
      ref: 'rain',
      title: 'rain',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/rainfall'
      }),
      style: new ol.style.Style({})
    })
  }

  function impacts () {
    return new ol.layer.Vector({
      ref: 'impacts',
      title: 'impacts',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/impacts'
      }),
      style: new ol.style.Style({})
    })
  }

  function location (name, center) {
    var feature = new window.ol.Feature({
      geometry: new window.ol.geom.Point(window.ol.proj.transform(center, 'EPSG:4326', 'EPSG:3857')),
      type: 'location',
      html: name
    })
    feature.setId('location')
    var locationPoint = new window.ol.source.Vector({
      features: [feature]
    })
    return new window.ol.layer.Vector({
      ref: 'location',
      renderMode: 'hybrid',
      source: locationPoint,
      style: maps.styles.location,
      zIndex: 2
    })
  }

  function top () {
    return new ol.layer.Vector({
      ref: 'top',
      renderMode: 'hybrid',
      zIndex: 10,
      source: new ol.source.Vector({
        features: [],
        format: new ol.format.GeoJSON()
      })
    })
  }

  layers.road = road
  layers.satellite = satellite
  /*
  layers.floodsSevere = floodPolygonsSevere
  layers.floodsWarning = floodPolygonsWarning
  layers.floodsAlert = floodPolygonsAlert
  layers.floodsNotInForce = floodPolygonsNotInForce
  layers.floodPolygon = floodPolygon
  */
  layers.polygons = polygons
  layers.floods = floods
  layers.stations = stations
  layers.impacts = impacts
  layers.rain = rain
  layers.location = location
  layers.top = top

  maps.layers = layers
})(window, window.flood.maps)
