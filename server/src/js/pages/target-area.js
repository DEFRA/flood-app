'use strict'
import 'elm-pep'
import '../components/nunjucks'
import '../components/map/maps'
import '../components/map/styles'
import '../components/map/layers'
import '../components/map/container'
import '../components/map/live'

// Create LiveMap
window.flood.maps.createLiveMap('map', {
  btnText: `View map of the flood ${window.flood.model.area.code.slice(4, 5).toLowerCase() === 'w' ? 'warning' : 'alert'} area`,
  btnClasses: 'defra-button-secondary defra-button-secondary--icon govuk-!-margin-top-4',
  data: {
    button: 'Target Area:Map view:TA - Map view'
  },
  layers: 'mv,ts,tw,ta',
  targetArea: {
    id: window.flood.model.area.code,
    name: window.flood.model.area.name,
    polygon: JSON.parse(window.flood.model.area.geom).coordinates
  },
  selectedId: 'flood.' + window.flood.model.area.code
})
