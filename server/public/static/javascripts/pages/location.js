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

  // var satellite = new ol.layer.Tile({
  //   ref: 'bing-road',
  //   source: new ol.source.BingMaps({
  //     key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
  //     imagerySet: 'road'
  //   }),
  //   visible: true,
  //   zIndex: 0
  // })

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

  var locationPoint = new window.ol.source.Vector({
    features: [
      new window.ol.Feature({
        geometry: new window.ol.geom.Point(window.ol.proj.transform(window.Flood.model.place.center, 'EPSG:4326', 'EPSG:3857')),
        type: 'location',
        isVisible: true,
        html: window.Flood.model.location
      })
    ]
  })

  var locationLayer = new window.ol.layer.Vector({
    renderMode: 'hybrid',
    source: locationPoint,
    style: flood.Map.locationStyle,
    zIndex: 2
  })

  var bbox = window.Flood.model.place.bbox
  var searchArea = {
    'type': 'Polygon',
    'coordinates': [
      [
        [bbox[0], bbox[1]],
        [bbox[0], bbox[3]],
        [bbox[2], bbox[3]],
        [bbox[2], bbox[1]]
      ]
    ]
  }

  var geoJson1 = new window.ol.format.GeoJSON()
  var searchAreaFeature = geoJson1.readFeatures(searchArea, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  })

  var searchAreaLayer = new window.ol.layer.Vector({
    source: new window.ol.source.Vector({
      format: geoJson1,
      features: searchAreaFeature
    })
  })

  var searchArea1 = flood.model.floods[0].extent
  var geoJson2 = new window.ol.format.GeoJSON()
  var searchAreaFeature1 = geoJson1.readFeatures(searchArea1, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  })

  var searchAreaLayer1 = new window.ol.layer.Vector({
    source: new window.ol.source.Vector({
      format: geoJson2,
      features: searchAreaFeature1
    })
  })

  var view = new ol.View({
    center: ol.proj.transform(window.Flood.model.place.center, 'EPSG:4326', 'EPSG:3857'),
    zoom: 11,
    minZoom: 6,
    maxZoom: 17,
    extent: flood.Map.extent
  })

  var accordionLevels = new flood.Accordion(document.querySelector('#warnings'))

  // New instance of Map
  var map = new flood.Map(document.querySelector('#map-now'), {
    type: 'now',
    buttonText: 'Map showing current risk',
    lonLat: [
      -1.4758,
      52.9219
    ],
    hasKey: true,
    hasSearch: false,
    hasLevels: true,
    showLevels: true,
    hasImpacts: false,
    view: view,
    layers: [
      road,
      searchAreaLayer,
      searchAreaLayer1,
      locationLayer,
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

  var searchExtent = ol.proj.transformExtent(bbox, 'EPSG:4326', 'EPSG:3857')
  // map.zoomToExtent(new OpenLayers.Bounds(minLng,minLat,maxLng,maxLat).transform("EPSG:4326", "EPSG:900913"))
  // var extent = my_vector_layer.getSource().getExtent();
  map.getView().fit(searchExtent, { size: map.getSize(), maxZoom: 16 })

})(window, window.Flood)
