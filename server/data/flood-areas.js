const geojson = require('geojson')
const floodAreas = require('./flood-areas.json')
const floodAreasGeo = geojson.parse(floodAreas.items, { Point: ['lat', 'long'] })

module.exports = floodAreasGeo
