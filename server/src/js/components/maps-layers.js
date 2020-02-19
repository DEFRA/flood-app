'use strict'
/*
Initialises the window.flood.maps layers
*/
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { BingMaps, Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'
import { transform } from 'ol/proj'
import { Feature } from 'ol'
import { bbox, all } from 'ol/loadingstrategy'
import { Point } from 'ol/geom'
import { Style } from 'ol/style'

window.flood.maps.layers = {
  road: () => {
    return new TileLayer({
      ref: 'road',
      source: new BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'RoadOnDemand'
      }),
      visible: true
    })
  },
  satellite: () => {
    return new TileLayer({
      ref: 'satellite',
      source: new BingMaps({
        key: 'Ajou-3bB1TMVLPyXyNvMawg4iBPqYYhAN4QMXvOoZvs47Qmrq7L5zio0VsOOAHUr',
        imagerySet: 'AerialWithLabelsOnDemand'
      }),
      visible: false
    })
  },
  polygons: () => {
    return new VectorLayer({
      ref: 'polygons',
      maxResolution: window.flood.maps.minResolution,
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: (extent) => {
          return `/api/ows?service=wfs&version=2.0.0&request=getFeature&typename=flood:flood_warning_alert&outputFormat=application/json&srsname=EPSG:3857&bbox=${extent.join(',')},EPSG:3857`
        },
        strategy: bbox
      }),
      style: window.flood.maps.styles.floods
    })
  },
  floods: () => {
    return new VectorLayer({
      ref: 'floods',
      minResolution: window.flood.maps.minResolution,
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/warnings.geojson',
        strategy: all
      }),
      style: window.flood.maps.styles.floods
    })
  },
  stations: () => {
    return new VectorLayer({
      ref: 'stations',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/stations.geojson'
      }),
      style: new Style({})
    })
  },
  rain: () => {
    return new VectorLayer({
      ref: 'rain',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/rainfall'
      }),
      style: new Style({})
    })
  },
  impacts: () => {
    return new VectorLayer({
      ref: 'impacts',
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/impacts'
      }),
      style: new Style({})
    })
  },
  location: (name, center) => {
    const feature = new Feature({
      geometry: new Point(transform(center, 'EPSG:4326', 'EPSG:3857')),
      type: 'location',
      html: name
    })
    feature.setId('location')
    const locationPoint = new VectorSource({
      features: [feature]
    })
    return new VectorLayer({
      ref: 'location',
      renderMode: 'hybrid',
      source: locationPoint,
      style: window.flood.maps.styles.location,
      zIndex: 2
    })
  },
  top: () => {
    return new VectorLayer({
      ref: 'top',
      renderMode: 'hybrid',
      zIndex: 10,
      source: new VectorSource({
        format: new GeoJSON()
      })
    })
  }
}
