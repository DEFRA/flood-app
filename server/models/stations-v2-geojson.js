const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normaliseFeatureId = (station) => {
  const stationId = station.rloi_id || station.id
  if (!stationId) {
    return undefined
  }

  return station.qualifier === 'd'
    ? `stations.${stationId}/downstream`
    : `stations.${stationId}`
}

const toFeature = (station) => ({
  type: 'Feature',
  id: normaliseFeatureId(station),
  geometry: Number.isFinite(station.lon) && Number.isFinite(station.lat)
    ? {
        type: 'Point',
        coordinates: [station.lon, station.lat]
      }
    : null,
  geometry_name: 'centroid',
  properties: {
    direction: station.qualifier || null,
    type: station.station_type || null,
    iswales: Boolean(station.iswales),
    atrisk: Boolean(station.atrisk),
    status: station.status || null,
    name: station.external_name || station.agency_name || null,
    river: station.river_name || null,
    value: toNumber(station.value),
    value_date: station.value_timestamp || null,
    trend: station.trend || null,
    percentile_5: toNumber(station.percentile_5),
    percentile_95: toNumber(station.percentile_95),
    is_ffoi: Boolean(station.is_ffoi),
    is_ffoi_at_risk: Boolean(station.is_ffoi_at_risk),
    ffoi_max: toNumber(station.ffoi_max),
    ffoi_date: station.ffoi_date || null,
    up: station.up || null,
    down: station.down || null,
    river_name: station.river_name || null,
    up_station_type: station.up_station_type || null,
    down_station_type: station.down_station_type || null,
    base_rloi_id: station.rloi_id || null
  }
})

module.exports = (stations, timeStamp = new Date().toISOString()) => {
  const filteredStations = Array.isArray(stations)
    ? stations.filter(station => station.station_type !== 'R')
    : []

  return {
    type: 'FeatureCollection',
    features: filteredStations.map(toFeature),
    totalFeatures: filteredStations.length,
    numberMatched: filteredStations.length,
    numberReturned: filteredStations.length,
    timeStamp,
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::4326'
      }
    }
  }
}
