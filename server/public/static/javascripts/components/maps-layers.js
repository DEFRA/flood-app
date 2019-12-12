(function (window, maps) {
  var ol = window.ol
  var layers = {}

  // Single callback for multiple XMLHttpRequests
  // https://gist.github.com/elrumordelaluz/cf32e84319126585ba6d
  // Can be removed when all features come from GeoServer
  var combinedRequest = {
    init: function (urlArray, callback) {
      var theFeatures = []
      combinedRequest.requestWrapper(urlArray, theFeatures, callback)
    },
    requestWrapper: function (urlArray, theFeatures, callback) {
      var requestObject = makeRequestObject()
      requestObject.onreadystatechange = processRequest
      /* (Defined below, as functions inside requestWrapper */
      var url = urlArray[0]
      requestObject.open('GET', url, true)
      requestObject.send(null)
      function makeRequestObject () {
        if (window.XMLHttpRequest) {
          return new XMLHttpRequest()
        } else if (window.ActiveXObject) {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }
      }
      function processRequest () {
        if (requestObject.readyState === 4) {
          if (requestObject.status === 200) {
            combinedRequest.takeText(urlArray, theFeatures, requestObject.responseText, callback)
          }
        }
      }
    },
    takeText: function (urlArray, theFeatures, responseText, callback) {
      theFeatures = theFeatures.concat(JSON.parse(responseText).features)
      urlArray.shift()
      if (urlArray.length > 0) {
        combinedRequest.requestWrapper(urlArray, theFeatures, callback)
      } else {
        combinedRequest.doCallback(theFeatures, callback)
      }
    },
    doCallback: function (theFeatures, callback) {
      callback(theFeatures)
    }
  }

  combinedRequest.init([
    '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert_centroid&maxFeatures=10000&outputFormat=application/json',
    '/ows?service=wfs&version=2.0.0&request=GetFeature&typeNames=flood:stations&propertyName=status,atrisk,type,is_ffoi_at_risk&outputFormat=application/json',
    '/impacts',
    '/rainfall'
  ], function (features) {
    features.forEach((feature, i) => {
      if (feature.id.substring(0, 4) === 'floo') {
        feature.id = 't' + feature.properties.fwa_code.toLowerCase()
        feature.geometry.coordinates[0] = Number(feature.geometry.coordinates[0].toFixed(6))
        feature.geometry.coordinates[1] = Number(feature.geometry.coordinates[1].toFixed(6))
        feature.properties.s = (feature.properties.severity * 10)
        feature.properties.pId = 'p' + feature.properties.fwa_code.toLowerCase()
        delete feature.properties.severity
        delete feature.geometry_name
        delete feature.properties.bbox
        delete feature.properties.fwa_code
        delete feature.properties.fwa_key
        delete feature.properties.severity_description
      } else if (feature.id.substring(0, 4) === 'stat') {
        feature.id = 's' + feature.id.slice(feature.id.lastIndexOf('.') + 1, feature.id.length)
        feature.geometry = {
          type: 'Point',
          coordinates: [Number(feature.properties.bbox[1].toFixed(6)), Number(feature.properties.bbox[0].toFixed(6))]
        }
        feature.properties.s = 14
        var status = feature.properties.status
        var atrisk = feature.properties.atrisk
        var isFfoiAtRisk = feature.properties.is_ffoi_at_risk
        if (status === 'Active' && atrisk) {
          feature.properties.s = 11
        } else if (status === 'Active' && isFfoiAtRisk) {
          feature.properties.s = 12
        } else if (status === 'Active') {
          feature.properties.s = 13
        }
        feature.properties.pId = ''
        delete feature.properties.status
        delete feature.properties.atrisk
        delete feature.properties.is_ffoi_at_risk
        delete feature.properties.type
        delete feature.properties.bbox
      } else if (feature.id.substring(0, 4) === 'rain') {
        feature.id = 'r' + feature.id.slice(feature.id.lastIndexOf('.') + 1, feature.id.length).toLowerCase()
        feature.properties.pId = ''
        feature.properties.s = 21
        delete feature.properties.label
        delete feature.properties.stationReference
        delete feature.properties.gridRef
        delete feature.properties.value
        delete feature.properties.latestDate
        delete feature.properties.stationDetails
      } else if (feature.id.substring(0, 4) === 'impa') {
        feature.id = 'i' + feature.id.slice(feature.id.lastIndexOf('.') + 1, feature.id.length)
        feature.properties.pId = ''
        feature.properties.s = 31
        delete feature.properties.shortName
        delete feature.properties.description
        delete feature.properties.stationId
        delete feature.properties.impactId
        delete feature.properties.stationName
        delete feature.properties.value
        delete feature.properties.obsDate
      }
    })
    /*
    console.log(JSON.stringify({
      type: 'FeatureCollection',
      features: features
    }))
    */
  })

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
          LAYERS: 'flood_warning_alert',
          CQL_FILTER: 'severity = 1'
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
          LAYERS: 'flood_warning_alert',
          CQL_FILTER: 'severity = 2'
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
          LAYERS: 'flood_warning_alert',
          CQL_FILTER: 'severity = 3'
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

  function centroids () {
    return new ol.layer.Vector({
      ref: 'centroids',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        loader: function (extent, resolution, projection) {
          extent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
          extent = [extent[1], extent[0], extent[3], extent[2]]
          var source = this
          var features = combinedRequest.init([
            '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert_centroid&maxFeatures=10000&outputFormat=application/json',
            '/ows?service=wfs&version=2.0.0&request=GetFeature&typeNames=flood:stations&propertyName=status,atrisk,type,is_ffoi_at_risk&outputFormat=application/json',
            '/impacts',
            '/rainfall'
          ], function (data) {
            console.log(data)
            return data
          })
          source.add(features)
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
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        loader: function (extent) {
          var source = this
          var url = '/ows?service=wfs&' +
              'version=2.0.0&request=GetFeature&typeNames=flood:stations&propertyName=status,atrisk,type,is_ffoi_at_risk&' +
              'outputFormat=application/json'
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

  /*
  function stations () {
    return new ol.layer.Vector({
      ref: 'stations',
      source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/stations.geojson'
      }),
      style: new ol.style.Style({})
    })
  }
  */

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
