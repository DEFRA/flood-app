'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const OutlookMatrix = require('../../server/models/outlook-matrix')
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
    const result = new OutlookMatrix(outlook)

    expect(result.matrixData).to.be.an.array()
    expect(result.matrixData).to.have.length(5)

    // Check specific values based on the test data
    // Day 1: River [3,4] from risk area 2557, Surface [2,3] from risk area 2559, Ground [2,2] from risk area 2564
    expect(result.matrixData[0][0]).to.equal([3, 4]) // River
    expect(result.matrixData[0][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[0][2]).to.equal([2, 3]) // Surface
    expect(result.matrixData[0][3]).to.equal([2, 2]) // Ground

    // Day 2: River [3,4] from risk areas 2557/2559, Surface [2,3] from risk area 2559
    expect(result.matrixData[1][0]).to.equal([3, 4]) // River
    expect(result.matrixData[1][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[1][2]).to.equal([2, 3]) // Surface
    expect(result.matrixData[1][3]).to.equal([0, 0]) // Ground

    // Day 3: River [3,4] from risk area 2556, Surface [2,2] from risk area 2561
    expect(result.matrixData[2][0]).to.equal([3, 4]) // River
    expect(result.matrixData[2][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[2][2]).to.equal([2, 2]) // Surface
    expect(result.matrixData[2][3]).to.equal([0, 0]) // Ground

    // Day 4: River [2,4] from risk area 2560, Surface [2,2] from risk area 2561
    expect(result.matrixData[3][0]).to.equal([2, 4]) // River
    expect(result.matrixData[3][1]).to.equal([0, 0]) // Coastal
    expect(result.matrixData[3][2]).to.equal([2, 2]) // Surface
    expect(result.matrixData[3][3]).to.equal([0, 0]) // Ground

    // Day 5: River [2,4] from risk area 2560, Surface [2,2] from risk area 2561
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
})
