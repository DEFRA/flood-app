(function (window, flood) {
  var ol = window.ol
  var Maps = flood.Maps
  var MapContainer = flood.MapContainer

  var road = new ol.layer.Tile({
    ref: 'bing-road',
    source: new ol.source.BingMaps({
      key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
      imagerySet: 'road'
    }),
    visible: false,
    zIndex: 0
  })

  var satellite = new ol.layer.Tile({
    ref: 'bing-aerial',
    source: new ol.source.BingMaps({
      key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
      imagerySet: 'AerialWithLabels'
    }),
    visible: true
  })

  var view = new ol.View({
    center: ol.proj.transform(Maps.center, 'EPSG:4326', 'EPSG:3857'),
    zoom: 6,
    minZoom: 6,
    maxZoom: 17,
    extent: Maps.extent
  })

  var geoJson = new window.ol.format.GeoJSON()
  var outlookGeoJson = flood.outlook.getGeoJson(flood.model.outlook)

  var areasOfConcernFeatures = geoJson.readFeatures(outlookGeoJson, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857'
  })

  var areasOfConcern = new window.ol.layer.Vector({
    zIndex: 200,
    source: new window.ol.source.Vector({
      format: geoJson,
      features: areasOfConcernFeatures
    })
  })

  // var sourceConcernAreas = new ol.source.Vector({
  //   format: new ol.format.GeoJSON(),
  //   loader: featureLoader,
  //   projection: 'EPSG:3857'
  // })

  // New instance of Map
  var container = new MapContainer(document.getElementById('map'), {
    buttonText: 'Map showing current risk',
    lonLat: [
      -1.4758,
      52.9219
    ],
    zoom: 14,
    hasKey: true,
    hasLevels: true,
    showLevels: true,
    view: view,
    layers: [
      road,
      satellite,
      areasOfConcern
    ],
    onFeatureClick: Maps.onFeatureClick
  })
})(window, window.Flood)
