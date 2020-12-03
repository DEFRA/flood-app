'use strict'
/*
Initialises the window.flood.maps layers
*/
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { BingMaps, Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'

const { xhr } = window.flood.utils

//
// Vector source
//

const targetAreaPolygonsSource = new VectorSource({
  format: new GeoJSON(),
  projection: 'EPSG:3857',
  // Custom loader to only send get request if below resolution cutoff
  loader: (extent, resolution) => {
    if (resolution < window.flood.maps.liveMaxBigZoom) {
      xhr(`/api/ows?service=wfs&version=2.0.0&request=getFeature&typename=flood:flood_warning_alert&outputFormat=application/json&srsname=EPSG:3857&bbox=${extent.join(',')},EPSG:3857`, (err, json) => {
        if (err) {
          console.log('Error: ' + err)
        } else {
          targetAreaPolygonsSource.addFeatures(new GeoJSON().readFeatures(json))
        }
      })
    }
  },
  // Custom strategy to only return extent if below resolution cutoff
  strategy: (extent, resolution) => {
    return resolution < window.flood.maps.liveMaxBigZoom ? [extent] : [[0, 0, 0, 0]]
  }
})

window.flood.maps.layers = {

  //
  // Tile layers
  //

  topography: () => {
    return new TileLayer({
      ref: 'road',
      source: new BingMaps({
        key: window.flood.model.bingMaps + '&c4w=1&cstl=rd&src=h&st=me|lv:0_trs|v:0_pt|v:0',
        imagerySet: 'RoadOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

  road: () => {
    return new TileLayer({
      ref: 'road',
      source: new BingMaps({
        key: window.flood.model.bingMaps,
        imagerySet: 'RoadOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

  satellite: () => {
    return new TileLayer({
      ref: 'satellite',
      source: new BingMaps({
        key: window.flood.model.bingMaps,
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

  //
  // Vector layers
  //

  places: () => {
    return new VectorLayer({
      ref: 'places',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/places.geojson'
      }),
      style: window.flood.maps.styles.places,
      visible: true,
      zIndex: 5,
      updateWhileAnimating: true,
      updateWhileInteracting: true,
      renderMode: 'hybrid'
    })
  },

  targetAreaPolygons: () => {
    return new VectorLayer({
      ref: 'targetAreaPolygons',
      source: targetAreaPolygonsSource,
      style: window.flood.maps.styles.targetAreaPolygons,
      visible: false,
      zIndex: 2
    })
  },

  warnings: () => {
    return new VectorLayer({
      ref: 'warnings',
      featureCodes: 'ts, tw, ta, tr',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/warnings.geojson'
      }),
      style: window.flood.maps.styles.warnings,
      visible: false,
      zIndex: 5
    })
  },

  stations: () => {
    return new VectorLayer({
      ref: 'stations',
      featureCodes: 'sh, st',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/stations.geojson'
      }),
      style: window.flood.maps.styles.stations,
      visible: false,
      zIndex: 4
    })
  },

  impacts: () => {
    return new VectorLayer({
      ref: 'impacts',
      featureCodes: 'hi',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/impacts'
      }),
      style: window.flood.maps.styles.impacts,
      visible: false,
      zIndex: 6
    })
  },

  areasOfConcern: () => {
    return new VectorLayer({
      ref: 'areasOfConcern',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/outlook.geojson'
      }),
      renderMode: 'hybrid',
      style: window.flood.maps.styles.outlookPolygons,
      opacity: 0.6,
      zIndex: 4
    })
  },

  selected: () => {
    return new VectorLayer({
      ref: 'selected',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857'
      }),
      zIndex: 10
    })
  }
}
