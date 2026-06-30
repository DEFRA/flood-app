'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const getStationsV2GeoJson = require('../../server/models/stations-v2-geojson')

describe('Model - Stations V2 GeoJSON', () => {
  it('should map stations to legacy geojson format and remove rainfall rows', () => {
    const stations = [
      {
        id: '320',
        rloi_id: 6281,
        qualifier: 'u',
        station_type: 'S',
        iswales: false,
        atrisk: true,
        status: 'Active',
        external_name: 'Whaddon',
        river_name: 'Whaddon Brook',
        value: '0.495',
        value_timestamp: '2026-06-30T11:45:00Z',
        trend: 'steady',
        percentile_5: '0.457000000000001',
        percentile_95: '0.167000000000002',
        is_ffoi: false,
        is_ffoi_at_risk: false,
        ffoi_max: null,
        ffoi_date: null,
        up: null,
        down: null,
        up_station_type: null,
        down_station_type: null,
        lon: -0.0173539,
        lat: 52.1018272
      },
      {
        id: 'rainfall-station',
        rloi_id: 9001,
        qualifier: 'u',
        station_type: 'R',
        lon: -0.1,
        lat: 52.1
      }
    ]

    const geoJson = getStationsV2GeoJson(stations, '2026-06-30T12:07:21.655Z')

    expect(geoJson.type).to.equal('FeatureCollection')
    expect(geoJson.features.length).to.equal(1)
    expect(geoJson.totalFeatures).to.equal(1)
    expect(geoJson.numberMatched).to.equal(1)
    expect(geoJson.numberReturned).to.equal(1)
    expect(geoJson.timeStamp).to.equal('2026-06-30T12:07:21.655Z')
    expect(geoJson.crs.properties.name).to.equal('urn:ogc:def:crs:EPSG::4326')

    const feature = geoJson.features[0]
    expect(feature.id).to.equal('stations.6281')
    expect(feature.geometry_name).to.equal('centroid')
    expect(feature.geometry.coordinates).to.equal([-0.0173539, 52.1018272])
    expect(feature.properties).to.equal({
      direction: 'u',
      type: 'S',
      iswales: false,
      atrisk: true,
      status: 'Active',
      name: 'Whaddon',
      river: 'Whaddon Brook',
      value: 0.495,
      value_date: '2026-06-30T11:45:00Z',
      trend: 'steady',
      percentile_5: 0.457000000000001,
      percentile_95: 0.167000000000002,
      is_ffoi: false,
      is_ffoi_at_risk: false,
      ffoi_max: null,
      ffoi_date: null,
      up: null,
      down: null,
      river_name: 'Whaddon Brook',
      up_station_type: null,
      down_station_type: null,
      base_rloi_id: 6281
    })
  })

  it('should create downstream feature ids for qualifier d', () => {
    const geoJson = getStationsV2GeoJson([
      {
        rloi_id: 1234,
        qualifier: 'd',
        station_type: 'S'
      }
    ], '2026-06-30T12:07:21.655Z')

    expect(geoJson.features[0].id).to.equal('stations.1234/downstream')
  })
})
