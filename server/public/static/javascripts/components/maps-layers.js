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

  function polygons () {
    return new ol.layer.Vector({
      ref: 'polygons',
      maxResolution: 200,
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        loader: function (extent, resolution, projection) {
          extent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
          extent = [extent[1], extent[0], extent[3], extent[2]]
          var source = this
          var url = '/ows?service=wfs&' +
              'version=2.0.0&request=GetFeature&typename=flood:flood_warning_alert&' +
              'outputFormat=application/json&bbox=' + extent.join(',')
          var xhr = new XMLHttpRequest()
          xhr.open('GET', url)
          var onError = function () {
            source.removeLoadedExtent(extent)
          }
          xhr.onerror = onError
          xhr.onload = function () {
            if (xhr.status === 200) {
              // source.addFeatures(source.getFormat().readFeatures(xhr.responseText))
              // Temporary fix to create usable id as per other features
              var features = source.getFormat().readFeatures(xhr.responseText)
              features.forEach((feature) => {
                feature.getGeometry().transform('EPSG:4326', 'EPSG:3857')
                feature.setId('flood.' + feature.get('fwa_code').toLowerCase())
              })
              source.addFeatures(features)
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
        url: '/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=flood:flood_warning_alert_centroid&maxFeatures=10000&outputFormat=application/json'
      }),
      style: maps.styles.floods
    })
  }

  function stations () {
    return new ol.layer.Vector({
      ref: 'stations',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        loader: function (extent) {
          var source = this
          var url = '/api/stations.geojson'
          var xhr = new XMLHttpRequest()
          xhr.open('GET', url)
          var onError = function () {
            source.removeLoadedExtent(extent)
          }
          xhr.onerror = onError
          xhr.onload = function () {
            if (xhr.status === 200) {
              // source.addFeatures(source.getFormat().readFeatures(xhr.responseText))
              // Temporary fix to minimal feature properties. Gets geometry from bounding box
              var features = source.getFormat().readFeatures(xhr.responseText)
              features.forEach((feature) => {
                var coordinates = ol.proj.transform([feature.get('bbox')[1], feature.get('bbox')[0]], 'EPSG:4326', 'EPSG:3857')
                feature.setGeometry(new ol.geom.Point(coordinates))
                feature.unset('bbox')
              })
              source.addFeatures(features)
            } else {
              onError()
            }
          }
          xhr.send()
        },
        strategy: ol.loadingstrategy.all
      }),
      style: new ol.style.Style({})
    })
  }

  function rain () {
    return new ol.layer.Vector({
      ref: 'rain',
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
        format: new ol.format.GeoJSON()
      })
    })
  }

  layers.road = road
  layers.satellite = satellite
  layers.polygons = polygons
  layers.floods = floods
  layers.stations = stations
  layers.impacts = impacts
  layers.rain = rain
  layers.location = location
  layers.top = top

  maps.layers = layers
})(window, window.flood.maps)
