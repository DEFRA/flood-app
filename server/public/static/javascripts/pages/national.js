(function (window, flood) {
  var ol = window.ol

  var sourceStations = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    projection: 'EPSG:3857',
    url: '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=flood:stations&maxFeatures=10000&outputFormat=application/json&srsName=EPSG:4326'
  })

  var stations = new ol.layer.Vector({
    title: 'stations',
    source: sourceStations,
    visible: true,
    style: flood.Map.stationsStyle,
    maxResolution: 800
  })

  var stationsWMS = new ol.layer.Tile({
    source: new ol.source.TileWMS({
      params: {
        'LAYERS': 'flood:stations',
        'FORMAT': 'image/png'
      },
      url: '/ows'
    }),
    maxResolution: 400
  })

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
    style: flood.Map.floodsCentroidStyle
  })

  var view = new ol.View({
    center: ol.proj.transform(flood.Map.center, 'EPSG:4326', 'EPSG:3857'),
    zoom: 6,
    minZoom: 6,
    maxZoom: 17,
    extent: flood.Map.extent
  })

  var accordionLevels = new flood.Accordion(document.querySelector('#warnings'))

  // New instance of Map
  var mapNow = new flood.Map(document.querySelector('#map-now'), {
    type: 'now',
    buttonText: 'Map showing current risk',
    lonLat: [
      -1.4758,
      52.9219
    ],
    zoom: 14,
    hasKey: true,
    hasSearch: false,
    hasLevels: true,
    showLevels: true,
    hasImpacts: false,
    view: view,
    layers: [
      road,
      floods,
      stations,
      floodCentroids
      // layer,
      // layer2,
      // stations,
      // poly2,
      // poly3,
      // poly4
    ]
  })
})(window, window.Flood)
