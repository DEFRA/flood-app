'use strict'

const Floods = require('../../server/models/floods')

describe('Floods model test', () => {
  it('Check floods model exists', () => {
    expect(Floods).toBeFunction()
  })
})

describe('Floods model getters', () => {
  it('should expose the timestamp and geojson', () => {
    const floods = new Floods({ timestamp: '1600000000', floods: [] })

    expect(floods.timestamp).toBe('1600000000')
    expect(floods.geojson).toEqual({ type: 'FeatureCollection', totalFeatures: 0, features: [] })
  })
})
