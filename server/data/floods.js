const geojson = require('geojson')
const floodData = require('./floods.json')
const floodAreas = require('./flood-areas.json')

const floods = floodData.items.map(flood => {
  const {
    floodAreaID: code,
    description,
    eaAreaName,
    floodArea: { county, riverOrSea, polygon },
    isTidal,
    message,
    severityLevel,
    timeMessageChanged,
    timeRaised,
    timeSeverityChanged
  } = flood

  const area = floodAreas.items.find(item => item.fwdCode === code)

  return {
    code,
    description,
    eaAreaName,
    county,
    riverOrSea,
    polygon,
    isTidal,
    message,
    severityLevel,
    timeMessageChanged,
    timeRaised,
    timeSeverityChanged,
    area: area,
    lat: area.lat,
    long: area.long
  }
})

const floodsGeo = geojson.parse(floods, { Point: ['lat', 'long'] })

module.exports = floodsGeo
