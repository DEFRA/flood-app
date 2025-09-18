const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')

const lab = exports.lab = Lab.script()
const { describe, it } = lab

const { generateOutlookContent } = require('../../server/models/outlook-content-generator.js')
const cases = require('../data/outlook-cases.js')

describe('generateOutlookContent (fixtures)', () => {
  cases.forEach(({ name, matrix, expected, now }) => {
    it(name, () => {
      const fixedNow = now ? new Date(now) : new Date('2025-01-01T00:00:00Z')
      const result = generateOutlookContent(matrix, fixedNow)
      expect(result).to.equal(expected)
    })
  })
})
