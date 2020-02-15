'use strict'
/*
  Intialises the window.flood.maps object with extent and center
*/
import { transformExtent } from 'ol/proj'

const extent = transformExtent([
  -5.75447130203247,
  49.9302711486816,
  1.79968345165253,
  55.8409309387207
], 'EPSG:4326', 'EPSG:3857')

window.flood.maps = {
  extent: extent,
  center: [
    -1.4758,
    52.9219
  ],
  minResolution: 100
}
