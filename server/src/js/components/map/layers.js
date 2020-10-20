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

  road: () => {
    return new TileLayer({
      ref: 'road',
      source: new BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr', // + '&c4w=1&cstl=rd&src=h&st=ar|fc:b5db81_wt|fc:a3ccff_tr|fc:50a964f4;sc:50a964f4_ard|fc:ffffff;sc:ffffff_rd|fc:50fed89d;sc:50eab671;lbc:626a6e_mr|lbc:626a6e_hr|lbc:626a6e_st|fc:ffffff;sc:ffffff_g|lc:dfdfdf_trs|lbc:626a6e',
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
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false,
      zIndex: 0
    })
  },

  //
  // Vector layers
  //

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

  // rainfall: () => {
  //   return new VectorLayer({
  //     ref: 'rainfall',
  //     featureCodes: 'rf',
  //     source: new VectorSource({
  //       format: new GeoJSON(),
  //       projection: 'EPSG:3857',
  //       url: '/api/rainfall'
  //     }),
  //     style: window.flood.maps.styles.rainfall,
  //     visible: false,
  //     zIndex: 3
  //   })
  // },

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
