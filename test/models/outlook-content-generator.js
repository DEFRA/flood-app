'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const { generateOutlookContent } = require('../../server/models/outlook-content-generator')

describe('Model - Outlook Content Generator', () => {
  it('should return placeholder message for valid matrix data', () => {
    const matrixData = [
      [[1, 2], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]],
      [[0, 0], [0, 0], [0, 0], [0, 0]] // Day 5
    ]
    const result = generateOutlookContent(matrixData)
    expect(result).to.equal('Outlook content generation in progress...')
  })
})
