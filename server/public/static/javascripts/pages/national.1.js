var layer = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/flood-areas.geojson'
  })
  // style: new ol.style.Style({
  //   image: new ol.style.Circle(({
  //     radius: 20,
  //     fill: new ol.style.Fill({
  //       color: '#ffff00'
  //     })
  //   }))
  // })
})

var stations = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/stations.geojson'
  })
  // style: new ol.style.Style({
  //   image: new ol.style.Circle(({
  //     radius: 20,
  //     fill: new ol.style.Fill({
  //       color: '#ffff00'
  //     })
  //   }))
  // })
})
var layer2 = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/floods.geojson'
  }),
  style: new window.ol.style.Style({
    image: new window.ol.style.Circle(({
      radius: 20,
      fill: new window.ol.style.Fill({
        color: '#ffff00'
      })
    }))
  })
})

var poly2 = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/flood-areas/053FWFPUWI06/polygon.geojson'
  })
  // style: new window.ol.style.Style({
  //   image: new window.ol.style.Circle(({
  //     radius: 20,
  //     fill: new window.ol.style.Fill({
  //       color: '#ffff00'
  //     })
  //   }))
  // })
})

var poly3 = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/flood-areas/123FWF315/polygon.geojson'
  })
})

var poly4 = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/flood-areas/123FWF316/polygon.geojson'
  })
})

var base = new window.ol.layer.Tile({
  ref: 'bing-road',
  source: new window.ol.source.BingMaps({
    key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
    imagerySet: 'road'
  }),
  visible: true,
  zIndex: 0
})

var floods = new window.ol.layer.Image({
  ref: 'alert-polygons',
  source: new window.ol.source.ImageWMS({
    url: '/ows?service=wms',
    serverType: 'geoserver',
    params: {
      'LAYERS': 'flood_warning_alert'
    }
  })
})

var extent = window.ol.proj.transformExtent([
  -5.75447130203247,
  49.9302711486816,
  1.79968345165253,
  55.8409309387207
], 'EPSG:4326', 'EPSG:3857')

var center = [
  -1.4758,
  52.9219
]

var view = new window.ol.View({
  center: window.ol.proj.transform(center, 'EPSG:4326', 'EPSG:3857'),
  zoom: 6,
  minZoom: 4,
  maxZoom: 17,
  extent: extent
})

var accordionLevels = new Accordion(document.querySelector('#warnings'))

// New instance of Map
var mapNow = new Map(document.querySelector('#map-now'), {
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
    base,
    floods
    // layer,
    // layer2,
    // stations,
    // poly2,
    // poly3,
    // poly4
  ]
})
