var areas = new window.ol.layer.Vector({
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
var floods = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/floods.geojson'
  }),
  style: new window.ol.style.Style({
    image: new window.ol.style.Circle(({
      radius: 2,
      fill: new window.ol.style.Fill({
        color: 'red'
      })
    }))
  })
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
  // style: self.styleFeatures,
  zIndex: 2
})

var geoJson = new window.ol.format.GeoJSON()
var floodFeatures = geoJson.readFeatures({
  type: 'FeatureCollection',
  features: window.Flood.model.floods
}, {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
})

var floods1 = new window.ol.layer.Vector({
  zIndex: 200,
  source: new window.ol.source.Vector({
    format: geoJson,
    features: floodFeatures
  }),
  style: new window.ol.style.Style({
    image: new window.ol.style.Circle(({
      radius: 2,
      fill: new window.ol.style.Fill({
        color: 'yellow'
      })
    }))
  })
})

var bbox = window.Flood.model.place.bbox
var searchArea = {
  'type': 'Polygon',
  'coordinates': [
    [ [bbox[0], bbox[1]], [bbox[0], bbox[3]], [bbox[2], bbox[3]], [bbox[2], bbox[1]] ]
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
  }),
  // style: new window.ol.style.Style({
  //   image: new window.ol.style.Circle(({
  //     radius: 2,
  //     fill: new window.ol.style.Fill({
  //       color: 'yellow'
  //     })
  //   }))
  // })
})

var poly2 = new window.ol.layer.Vector({
  source: new window.ol.source.Vector({
    format: new window.ol.format.GeoJSON(),
    url: '/flood-areas/053FWFPUWI06/polygon.geojson'
  })
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

var floodsAreas = window.Flood.model.floods.map(function (flood) {
  return new window.ol.layer.Vector({
    source: new window.ol.source.Vector({
      format: new window.ol.format.GeoJSON(),
      url: '/flood-areas/' + flood.properties.code + '/polygon.geojson'
    })
  })
})

var wms = new window.ol.layer.Tile({
  extent: [-13884991, 2870341, -7455066, 6338219],
  source: new window.ol.source.TileWMS({
    url: 'https://ahocevar.com/geoserver/wms',
    params: { 'LAYERS': 'topp:states', 'TILED': true },
    serverType: 'geoserver',
    // Countries have transparency, so do not fade tiles:
    transition: 0
  })
})

// New instance of Map
var mapNow = new Map(document.querySelector('#map-now'), {
  type: 'now',
  buttonText: 'Map showing current risk',
  lonLat: [
    -1.4758,
    52.9219],
  zoom: 6,
  hasKey: true,
  hasSearch: false,
  hasLevels: true,
  showLevels: true,
  hasImpacts: false,
  layers: [
    new window.ol.layer.Tile({
      source: new window.ol.source.OSM(),
      zIndex: 0
    }),
    locationLayer,
    // layer,
    floods,
    floods1,
    searchAreaLayer,
    // stations,
    poly2,
    poly3,
    poly4
  ].concat(floodsAreas)
})
