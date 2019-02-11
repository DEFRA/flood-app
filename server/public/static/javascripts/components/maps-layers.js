(function (window, maps) {
  var ol = window.ol
  var layers = {}

  function road () {
    return new ol.layer.Tile({
      ref: 'bing-road',
      source: new ol.source.BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'RoadOnDemand'
      }),
      visible: true,
      zIndex: 0
    })
  }

  function satellite () {
    return new ol.layer.Tile({
      ref: 'bing-aerial',
      source: new ol.source.BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false
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
      style: maps.styles.stations,
      visible: false
    })
  }

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
      })
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
      })
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
      })
    })
    /*
    return new ol.layer.Vector({
      ref: 'floods-alert',
      maxResolution: 200,
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        loader: function(extent, resolution, projection) {
          var source = this
          var proj = projection.getCode();
          var url = '/ows?service=wfs&' +
              'version=1.3.0&request=GetFeature&typename=flood:flood_warning_alert&' +
              'outputFormat=application/json&srsname=' + proj + '&' +
              'bbox=' + extent.join(',') + ',' + proj
          var xhr = new XMLHttpRequest()
          xhr.open('GET', url)
          var onError = function() {
            source.removeLoadedExtent(extent)
          }
          xhr.onerror = onError
          xhr.onload = function() {
            if (xhr.status == 200) {
              source.addFeatures(source.getFormat().readFeatures(xhr.responseText))
            } else {
              onError()
            }
          }
          xhr.send()
        },
        strategy: ol.loadingstrategy.bbox
      })
    })
    */
  }

/*
'http://localhost:3009/ows?service=wfs&' +
'version=1.3.0&'+
'request=GetFeature&' +
'typeNames=flood:flood_warning_alert&' +
'bbox='+extent.join()+',urn:ogc:def:crs:EPSG:3857'
*/

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
      })
    })
  }

  function floodPolygon () {
    return new ol.layer.Vector({
      ref: 'flood-polygon',
      maxResolution: 200,
      style: maps.styles.floodPolygon
    })
  }

  function floodCentroids () {
    return new ol.layer.Vector({
      ref: 'flood-centroids',
      minResolution: 200,
      source: new ol.source.Vector({
        url: '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert_centroid&maxFeatures=10000&outputFormat=application/json',
        format: new ol.format.GeoJSON()
      }),
      style: maps.styles.floods
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

  function selectedPointFeature () {
    return new window.ol.layer.Vector({
      ref: 'selected-point-feature',
      renderMode: 'hybrid',
      zIndex: 10
    })
  }

  layers.road = road
  layers.satellite = satellite
  layers.floodsSevere = floodPolygonsSevere
  layers.floodsWarning = floodPolygonsWarning
  layers.floodsAlert = floodPolygonsAlert
  layers.floodsNotInForce = floodPolygonsNotInForce
  layers.floodPolygon = floodPolygon
  layers.floodCentroids = floodCentroids
  layers.stations = stations
  layers.location = location
  layers.selectedPointFeature = selectedPointFeature

  maps.layers = layers
})(window, window.flood.maps)
