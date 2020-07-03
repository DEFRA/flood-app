'use strict'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Add browser back button
window.flood.utils.addBrowserBackButton()

// Create LiveMap
window.flood.maps.createLiveMap('map', {
  btnText: `View map of flood ${window.flood.model.area.code.slice(4, 5).toLowerCase() === 'w' ? 'warning' : 'alert'} area`,
  btnClasses: 'defra-button-map govuk-!-margin-bottom-4',
  layers: 'mv,ts,tw,ta',
  targetArea: {
    id: window.flood.model.area.code,
    name: window.flood.model.area.name,
    polygon: JSON.parse(window.flood.model.area.geom).coordinates
  },
  selectedId: 'flood.' + window.flood.model.area.code
})
