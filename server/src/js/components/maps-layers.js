'use strict'
/*
Initialises the window.flood.maps layers
*/
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { BingMaps, Vector as VectorSource } from 'ol/source'
import { GeoJSON } from 'ol/format'
import { transform, transformExtent } from 'ol/proj'
import { Feature } from 'ol'
import * as loadingstrategy from 'ol/loadingstrategy'
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
      visible: true,
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
      visible: false
    })
  },
  polygons: () => {
    return new VectorLayer({
      ref: 'polygons',
      maxResolution: 200,
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        loader: function (extent, resolution, projection) {
          extent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
          extent = [extent[1], extent[0], extent[3], extent[2]]
          const source = this
          const url = '/api/ows?service=wfs&' +
            'version=2.0.0&request=GetFeature&typename=flood:flood_warning_alert&' +
            'outputFormat=application/json&bbox=' + extent.join(',')
          const xhr = new window.XMLHttpRequest()
          xhr.open('GET', url)
          const onError = function () {
            source.removeLoadedExtent(extent)
          }
          xhr.onerror = onError
          xhr.onload = function () {
            if (xhr.status === 200) {
              // source.addFeatures(source.getFormat().readFeatures(xhr.responseText))
              // Temporary fix to create usable id as per other features
              const features = source.getFormat().readFeatures(xhr.responseText)
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
        strategy: loadingstrategy.bbox
      }),
      style: window.flood.maps.styles.floods
    })
  },
  floods: () => {
    return new VectorLayer({
      ref: 'floods',
      minResolution: 200,
      source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: '/api/warnings.geojson'
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
        loader: function (extent) {
          const source = this
          const url = '/api/stations.geojson'
          const xhr = new window.XMLHttpRequest()
          xhr.open('GET', url)
          const onError = function () {
            source.removeLoadedExtent(extent)
          }
          xhr.onerror = onError
          xhr.onload = function () {
            if (xhr.status === 200) {
              // source.addFeatures(source.getFormat().readFeatures(xhr.responseText))
              // Temporary fix to minimal feature properties. Gets geometry from bounding box
              const features = source.getFormat().readFeatures(xhr.responseText)
              features.forEach((feature) => {
                const coordinates = transform([feature.get('bbox')[1], feature.get('bbox')[0]], 'EPSG:4326', 'EPSG:3857')
                feature.setGeometry(new Point(coordinates))
                feature.unset('bbox')
              })
              source.addFeatures(features)
            } else {
              onError()
            }
          }
          xhr.send()
        },
        strategy: loadingstrategy.all
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
