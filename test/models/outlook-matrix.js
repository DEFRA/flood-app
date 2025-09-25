'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const OutlookMatrix = require('../../server/models/forecast-outlook/outlook-matrix')
const outlookOverlaping = require('../data/fgsOverlaping.json')
const outlook = require('../data/fgs.json')

describe('Model - Outlook Matrix', () => {
  it('should generate a 5x4 matrix with overlapping outlook data', () => {
    const result = new OutlookMatrix(outlookOverlaping)

    // Should return a 5x4 matrix (5 days, 4 sources: surface, river, ground, coastal)
    expect(result.matrixData).to.be.an.array()
    expect(result.matrixData).to.have.length(5) // 5 days

    result.matrixData.forEach(day => {
      expect(day).to.be.an.array()
      expect(day).to.have.length(4) // 4 sources
      day.forEach(source => {
        expect(source).to.be.an.array()
        expect(source).to.have.length(2) // [impact, likelihood]
        expect(source[0]).to.be.a.number() // impact
        expect(source[1]).to.be.a.number() // likelihood
      })
    })
  })

  it('should produce matrix with surface and river data over multiple days', () => {
    // Provide a location that will include the test data risk areas
    const testLocation = {
      bbox2k: [-2, 53, 0, 54] // Bounding box that covers the test data areas
    }
    const result = new OutlookMatrix(outlook, testLocation)

    expect(result.matrixData).to.be.an.array()
    expect(result.matrixData).to.have.length(5)

    // Check specific values based on the test data with the provided bounding box
    // Day 1: River [3,4] from intersecting risk areas, Ground [2,2] from intersecting areas
    expect(result.matrixData[0][0]).to.equal([3, 4]) // River
    expect(result.matrixData[0][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[0][2]).to.equal([0, 0]) // Surface (not intersecting with this bbox)
    expect(result.matrixData[0][3]).to.equal([2, 2]) // Ground

    // Day 2: River [3,4] from intersecting risk areas
    expect(result.matrixData[1][0]).to.equal([3, 4]) // River
    expect(result.matrixData[1][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[1][2]).to.equal([0, 0]) // Surface
    expect(result.matrixData[1][3]).to.equal([0, 0]) // Ground

    // Day 3: River [3,4] from intersecting areas, Surface [2,2] from intersecting areas
    expect(result.matrixData[2][0]).to.equal([3, 4]) // River
    expect(result.matrixData[2][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[2][2]).to.equal([2, 2]) // Surface
    expect(result.matrixData[2][3]).to.equal([0, 0]) // Ground

    // Day 4: River [2,4] from intersecting areas, Surface [2,2] from intersecting areas
    expect(result.matrixData[3][0]).to.equal([2, 4]) // River
    expect(result.matrixData[3][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[3][2]).to.equal([2, 2]) // Surface
    expect(result.matrixData[3][3]).to.equal([0, 0]) // Ground

    // Day 5: River [2,4] from intersecting areas, Surface [2,2] from intersecting areas
    expect(result.matrixData[4][0]).to.equal([2, 4]) // River
    expect(result.matrixData[4][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[4][2]).to.equal([2, 2]) // Surface
    expect(result.matrixData[4][3]).to.equal([0, 0]) // Ground
  })

  it('should produce a matrix with all zeros for outlook with no risk areas', () => {
    const result = new OutlookMatrix({ risk_areas: [] })

    expect(result.matrixData).to.be.an.array()
    expect(result.matrixData).to.have.length(5)

    // All values should be [0, 0]
    result.matrixData.forEach(day => {
      day.forEach(source => {
        expect(source).to.equal([0, 0])
      })
    })
  })

  it('should handle empty outlook data gracefully', () => {
    const result = new OutlookMatrix({})

    expect(result.matrixData).to.be.an.array()
    expect(result.matrixData).to.have.length(5)

    // All values should be [0, 0]
    result.matrixData.forEach(day => {
      day.forEach(source => {
        expect(source).to.equal([0, 0])
      })
    })
  })

  it('should handle null or undefined outlook data', () => {
    const result = new OutlookMatrix(null)

    expect(result.matrixData).to.be.an.array()
    expect(result.matrixData).to.have.length(5)

    // All values should be [0, 0]
    result.matrixData.forEach(day => {
      day.forEach(source => {
        expect(source).to.equal([0, 0])
      })
    })
  })

  it('should filter risk areas by location when location is provided', () => {
    // Test with a location that intersects with some risk areas
    const londonLocation = {
      bbox2k: [-0.5, 51.3, 0.3, 51.7] // London bounding box
    }
    const resultWithLocation = new OutlookMatrix(outlook, londonLocation)

    // Test with no location (should return empty matrix)
    const resultNoLocation = new OutlookMatrix(outlook)

    // Results should be different - location-specific should have some data, no location should be empty
    expect(resultWithLocation.matrixData).to.not.equal(resultNoLocation.matrixData)

    // London should have some ground water risk but minimal other risks
    expect(resultWithLocation.matrixData[0][3]).to.equal([0, 0]) // Ground water - no intersection for London
    expect(resultWithLocation.matrixData[0][0]).to.equal([2, 3]) // River - some intersection for London
    expect(resultWithLocation.matrixData[0][2]).to.equal([2, 3]) // Surface - some intersection for London

    // No location should return all zeros
    resultNoLocation.matrixData.forEach(day => {
      day.forEach(source => {
        expect(source).to.equal([0, 0])
      })
    })
  })

  it('should return empty matrix when no location is provided', () => {
    const result = new OutlookMatrix(outlook)

    // Should return empty matrix (all zeros) when no location provided
    expect(result.matrixData).to.be.an.array()
    expect(result.matrixData).to.have.length(5)

    // All values should be [0, 0] - no national fallback
    result.matrixData.forEach(day => {
      day.forEach(source => {
        expect(source).to.equal([0, 0])
      })
    })
  })
})
