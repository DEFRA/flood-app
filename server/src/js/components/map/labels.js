import { Feature } from 'ol'
import { fromExtent } from 'ol/geom/Polygon'
import GeoJSON from 'ol/format/GeoJSON'

import { polygon, multiPolygon } from '@turf/helpers'
import simplify from '@turf/simplify'
import intersect from '@turf/intersect'

const { getParameterByName, getSummaryList } = window.flood.utils

// Get features visible in the current viewport
export const toggleVisibleFeatures = ({ labels, container, dataLayers, maps, targetAreaPolygons, warnings, bigZoom, targetArea, viewportDescription }) => {
  labels.getSource().clear()
  const lyrs = getParameterByName('lyr') ? getParameterByName('lyr').split(',') : []
  const resolution = container.map.getView().getResolution()
  const isBigZoom = resolution <= bigZoom
  const extent = container.map.getView().calculateExtent(container.map.getSize())
  const layers = dataLayers.filter(layer => layer !== targetAreaPolygons && lyrs.some(lyr => layer.get('featureCodes').includes(lyr)))
  // Add target area if it isn't an active alert or warning
  if (!layers.includes(warnings) && targetArea.pointFeature) layers.push(warnings)
  // Add vectortile polygons to labels
  if (layers.includes(warnings) && isBigZoom) {
    let warningPolygonFeatures = getWarningPolygonsIntersectingExtent({ extent, targetAreaPolygons, warnings })
    warningPolygonFeatures = mergePolygons(warningPolygonFeatures, extent)
    addWarningPolygonsToLabels({ features: warningPolygonFeatures, labels })
  }
  // Add point features to labels
  addPointFeaturesToLabels({ layers, extent, container, isBigZoom, labels })
  const features = labels.getSource().getFeatures()
  // Show labels if count is between 1 and 9
  const hasAccessibleFeatures = maps.isKeyboard && features.length <= 9
  labels.setVisible(hasAccessibleFeatures)
  // Build model
  const numWarnings = features.filter(feature => [1, 2].includes(feature.get('severity'))).length
  const numAlerts = features.filter(feature => feature.get('severity') === 3).length
  const numLevels = features.length - numWarnings - numAlerts
  const model = {
    numFeatures: features.length,
    summary: getSummaryList([
      { count: numWarnings, text: 'flood warning' },
      { count: numAlerts, text: 'flood alert' },
      { count: numLevels, text: 'water level measurement' }
    ]),
    features: features.map((feature, i) => ({
      type: feature.get('type'),
      severity: feature.get('severity'),
      name: feature.get('name'),
      river: feature.get('river')
    }))
  }
  // Update viewport description
  const html = window.nunjucks.render('description-live.html', { model })
  viewportDescription.innerHTML = html
  // Set numeric id and move featureId to properties
  if (!hasAccessibleFeatures) return
  features.forEach((feature, i) => {
    feature.set('featureId', feature.getId())
    feature.setId((i + 1))
  })
}

// Simplify, clip and merge vector tile polygons
const mergePolygons = (features, extent) => {
  const mergedPolygons = []
  const turfExtentPolygon = polygon(fromExtent(extent).getCoordinates())
  features.forEach(feature => {
    const coordinates = feature.getGeometry().getCoordinates()
    // Simplify polygons
    const options = { tolerance: 100, highQuality: false }
    const turfPolygon = feature.getGeometry().getType() === 'MultiPolygon'
      ? simplify(multiPolygon(coordinates), options)
      : simplify(polygon(coordinates), options)
    // Clip polygons to extent
    const clippedPolygon = intersect(turfPolygon, turfExtentPolygon)
    if (!clippedPolygon) return
    feature.setGeometry(new GeoJSON().readFeature(clippedPolygon).getGeometry())

    mergedPolygons.push(feature)
  })
  return mergedPolygons
}

// Get Warning Polygons Features Intersecting Extent
const getWarningPolygonsIntersectingExtent = ({ extent, targetAreaPolygons, warnings }) => {
  const warningsPolygons = []
  targetAreaPolygons.getSource().getFeaturesInExtent(extent).forEach(feature => {
    const warning = warnings.getSource().getFeatureById(feature.getId().replace(/^flood_warning_alert./, 'flood.'))
    if (warning && warning.get('isVisible')) {
      const warningsPolygon = new Feature({
        geometry: feature.getGeometry(),
        name: warning.get('ta_name'),
        type: warning.get('severity'),
        severity: warning.get('severity_value')
      })
      warningsPolygon.setId(feature.getId().replace(/^flood_warning_alert./, 'flood.'))
      warningsPolygons.push(warningsPolygon)
    }
  })
  return warningsPolygons
}

// Add point features intersecting extent to labels source
const addPointFeaturesToLabels = ({ layers, extent, container, isBigZoom, labels }) => {
  for (const layer of layers) {
    if (labels.getSource().getFeatures().length > 9) break
    const pointFeatures = layer.getSource().getFeaturesInExtent(extent)
    for (const feature of pointFeatures) {
      if ((feature.get('isVisible') && layer.get('ref') !== 'warnings') || (layer.get('ref') === 'warnings' && !isBigZoom)) {
        const pointFeature = new Feature({
          geometry: feature.getGeometry(),
          name: feature.get('name'),
          type: feature.get('type'),
          severity: feature.get('severity'),
          river: feature.get('river_name')
        })
        pointFeature.setId(feature.getId())
        if (labels.getSource().getFeatures().length > 9) break
        labels.getSource().addFeature(pointFeature)
      }
    }
  }
}

// Add warning polygons to labels source
const addWarningPolygonsToLabels = ({ features, labels }) => {
  features.forEach(feature => {
    const geometry = feature.getGeometry()
    feature.setGeometry(geometry.getType() === 'MultiPolygon'
      ? geometry.getInteriorPoints()
      : geometry.getInteriorPoint()
    )
    labels.getSource().addFeature(feature)
  })
}

// Set selected feature
export const toggleSelectedFeature = ({ newFeatureId = '', replaceHistory, dataLayers, selected, container, setFeatureHtml, state, targetAreaPolygons, maps }) => {
  selected.getSource().clear()
  dataLayers.forEach(layer => {
    if (layer === targetAreaPolygons) return
    const originalFeature = layer.getSource().getFeatureById(state.selectedFeatureId)
    const newFeature = layer.getSource().getFeatureById(newFeatureId)
    if (originalFeature) {
      originalFeature.set('isSelected', false)
    }
    if (newFeature) {
      newFeature.set('isSelected', true)
      setFeatureHtml(newFeature)
      selected.getSource().addFeature(newFeature)
      selected.setStyle(maps.styles[layer.get('ref') === 'warnings' ? 'warnings' : 'stations']) // WebGL: layers don't use a style function
      container.showInfo('Selected feature information', newFeature.get('html'))
    }
    if (layer.get('ref') === 'warnings') {
      // Refresh vector tiles
      targetAreaPolygons.setStyle(maps.styles.targetAreaPolygons)
    }
  })
  state.selectedFeatureId = newFeatureId
  // Update url
  replaceHistory('fid', newFeatureId)
}
