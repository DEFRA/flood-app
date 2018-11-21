(function (window, flood) {
  var ol = window.ol
  var Maps = flood.Maps
  var MapContainer = flood.MapContainer

  var sourceStations = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    projection: 'EPSG:3857',
    url: '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:stations&maxFeatures=10000&outputFormat=application/json&srsName=EPSG:4326'
  })

  var stations = new ol.layer.Vector({
    title: 'stations',
    source: sourceStations,
    visible: true,
    style: Maps.stationsStyle,
    maxResolution: 800
  })

  // var stationsWMS = new ol.layer.Tile({
  //   source: new ol.source.TileWMS({
  //     params: {
  //       'LAYERS': 'flood:stations',
  //       'FORMAT': 'image/png'
  //     },
  //     url: '/ows'
  //   }),
  //   maxResolution: 400
  // })

  var road = new ol.layer.Tile({
    ref: 'bing-road',
    source: new ol.source.BingMaps({
      key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
      imagerySet: 'road'
    }),
    visible: true,
    zIndex: 0
  })

  var satellite = new ol.layer.Tile({
    ref: 'bing-aerial',
    source: new ol.source.BingMaps({
      key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
      imagerySet: 'AerialWithLabels'
    }),
    visible: false
  })

  var floods = new ol.layer.Image({
    ref: 'alert-polygons',
    source: new ol.source.ImageWMS({
      url: '/ows?service=wms',
      serverType: 'geoserver',
      params: {
        'LAYERS': 'flood_warning_alert'
      }
    })
  })

  var floodCentroids = new ol.layer.Vector({
    ref: 'alert-centroids',
    source: new ol.source.Vector({
      url: '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:flood_warning_alert_centroid&maxFeatures=10000&outputFormat=application/json',
      format: new ol.format.GeoJSON()
    }),
    style: Maps.floodsCentroidStyle
  })

  var view = new ol.View({
    center: ol.proj.transform(Maps.center, 'EPSG:4326', 'EPSG:3857'),
    zoom: 6,
    minZoom: 6,
    maxZoom: 14,
    extent: Maps.extent
  })

  // New instance of Map
  var container = new MapContainer(document.getElementById('map-now'), {
    type: 'now',
    buttonText: 'Map showing current risk',
    lonLat: Maps.lonLat,
    zoom: 14,
    hasKey: true,
    view: view,
    layers: [
      road,
      satellite,
      floods,
      stations,
      floodCentroids
    ],
    onFeatureClick: Maps.onFeatureClick
  })

  var keyForm = container.keyElement.querySelector('form')

  function setFloodsVisibility (severity, visible) {
    floodCentroids.getSource().forEachFeature(function (feature) {
      if (severity.indexOf(feature.get('severity')) > -1) {
        feature.setStyle(visible ? null : new ol.style.Style({}))
      }
    })
  }

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
        setFloodsVisibility([1, 2], target.checked)
        break
      }
      case 'floodAlerts': {
        setFloodsVisibility([3], target.checked)
        break
      }
      case 'floodExpired': {
        setFloodsVisibility([4], target.checked)
        break
      }
    }
  })
})(window, window.Flood)
