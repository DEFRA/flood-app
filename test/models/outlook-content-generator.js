const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')

const lab = exports.lab = Lab.script()
const { describe, it } = lab

const { generateOutlookContent } = require('../../server/models/forecast-outlook/outlook-content-generator.js')
const cases = require('../data/outlook-cases.js')

describe('generateOutlookContent (fixtures)', () => {
  cases.forEach(({ name, matrix, expected, now }) => {
    it(name, () => {
      const fixedNow = now ? new Date(now) : new Date('2025-01-01T00:00:00Z')
      const result = generateOutlookContent(matrix, fixedNow)
      expect(result).to.equal(expected, { message: `Failed for test case: ${name}` })
    })
  })
})

describe('generateOutlookContent (day skipping logic)', () => {
  const testMatrix = [
    [[0, 0], [0, 0], [0, 0], [0, 0]], // Day 0 - no risk
    [[4, 2], [0, 0], [0, 0], [0, 0]], // Day 1 - high risk rivers
    [[4, 3], [0, 0], [0, 0], [0, 0]], // Day 2 - high risk rivers
    [[4, 4], [0, 0], [0, 0], [0, 0]], // Day 3 - very high risk rivers
    [[0, 0], [0, 0], [0, 0], [0, 0]] // Day 4 - no risk
  ]

  it('should show "Today" for day 0 when issued today (daysSinceIssue=0)', () => {
    const testMatrix = [
      [[4, 2], [0, 0], [0, 0], [0, 0]], // Day 0 - HAS RISK (Today)
      [[4, 3], [0, 0], [0, 0], [0, 0]], // Day 1 - high risk rivers
      [[4, 4], [0, 0], [0, 0], [0, 0]], // Day 2
      [[3, 3], [0, 0], [0, 0], [0, 0]], // Day 3
      [[0, 0], [0, 0], [0, 0], [0, 0]] // Day 4 - no risk
    ]

    const issuedDate = new Date('2025-01-01T08:00:00Z') // Wednesday
    const result = generateOutlookContent(testMatrix, issuedDate, 0)

    expect(result).to.be.an.array()
    expect(result.length).to.be.greaterThan(0)
    // First day should be labeled "Today" (Day 0)
    expect(result[0].label).to.equal('Today')
  })

  it('should skip day 0 and show "Today" for day 1 when issued yesterday (daysSinceIssue=1)', () => {
    const issuedDate = new Date('2024-12-31T08:00:00Z') // Tuesday (yesterday)
    const result = generateOutlookContent(testMatrix, issuedDate, 1)

    expect(result).to.be.an.array()
    expect(result.length).to.equal(4) // 4 days remaining (skipped day 0)
    // First day should be "Today" (which is Day 1 from original matrix)
    expect(result[0].label).to.equal('Today')
  })

  it('should skip days 0-1 and show "Today" for day 2 when issued 2 days ago (daysSinceIssue=2)', () => {
    const issuedDate = new Date('2024-12-30T08:00:00Z') // Monday (2 days ago)
    const result = generateOutlookContent(testMatrix, issuedDate, 2)

    expect(result).to.be.an.array()
    expect(result.length).to.equal(3) // 3 days remaining (skipped days 0-1)
    // First day should be "Today" (which is Day 2 from original matrix)
    expect(result[0].label).to.equal('Today')
  })

  it('should return empty array when all days are in the past (daysSinceIssue=5)', () => {
    const issuedDate = new Date('2024-12-27T08:00:00Z') // 5 days ago
    const result = generateOutlookContent(testMatrix, issuedDate, 5)

    expect(result).to.equal([])
  })
})

describe('generateOutlookContent (date label logic)', () => {
  const allLowRiskMatrix = [
    [[1, 1], [0, 0], [0, 0], [0, 0]], // Day 0 - very low
    [[1, 1], [0, 0], [0, 0], [0, 0]], // Day 1 - very low
    [[1, 1], [0, 0], [0, 0], [0, 0]], // Day 2 - very low
    [[1, 1], [0, 0], [0, 0], [0, 0]], // Day 3 - very low
    [[1, 1], [0, 0], [0, 0], [0, 0]] // Day 4 - very low
  ]

  it('should use "Today" and "Tomorrow" when issued on Wednesday', () => {
    const wednesday = new Date('2025-01-01T08:00:00Z') // Wednesday
    const result = generateOutlookContent(allLowRiskMatrix, wednesday, 0)

    // Should show "The flood risk is very low" message
    expect(result).to.equal([{ sentences: ['The flood risk is very low.'] }])
  })

  it('should use actual day names (not "Today"/"Tomorrow") when forecast is old', () => {
    const testMatrix = [
      [[4, 2], [0, 0], [0, 0], [0, 0]], // Day 0 - Monday
      [[4, 3], [0, 0], [0, 0], [0, 0]], // Day 1 - Tuesday
      [[4, 4], [0, 0], [0, 0], [0, 0]], // Day 2 - Wednesday
      [[3, 3], [0, 0], [0, 0], [0, 0]], // Day 3 - Thursday
      [[4, 2], [0, 0], [0, 0], [0, 0]] // Day 4 - Friday
    ]

    // Issued on Wednesday, now viewing on Thursday (only 1 day passed)
    const issuedDate = new Date('2025-01-01T08:00:00Z') // Wednesday Jan 1
    const daysSinceIssue = 1 // Only 1 day has passed (within 48 hours)

    const result = generateOutlookContent(testMatrix, issuedDate, daysSinceIssue)

    // Should have 4 days remaining (days 1-4)
    expect(result).to.be.an.array()
    expect(result.length).to.be.greaterThan(0)
    expect(result[0].label).to.equal('Today') // Day 1 becomes "Today"
    expect(result[1].label).to.equal('Tomorrow') // Day 2 becomes "Tomorrow"
  })

  it('should correctly handle midnight transitions', () => {
    const testMatrix = [
      [[4, 2], [0, 0], [0, 0], [0, 0]], // Day 0 - yesterday
      [[4, 3], [0, 0], [0, 0], [0, 0]], // Day 1 - today
      [[4, 4], [0, 0], [0, 0], [0, 0]], // Day 2 - tomorrow
      [[3, 3], [0, 0], [0, 0], [0, 0]], // Day 3 - day after
      [[0, 0], [0, 0], [0, 0], [0, 0]] // Day 4 - low risk
    ]

    // Issued yesterday at 23:00, now it's past midnight
    const issuedDate = new Date('2024-12-31T23:00:00Z') // Tuesday 23:00
    const daysSinceIssue = 1 // Past midnight, so skip day 0

    const result = generateOutlookContent(testMatrix, issuedDate, daysSinceIssue)

    expect(result).to.be.an.array()
    expect(result.length).to.be.greaterThan(0)
    expect(result[0].label).to.equal('Today') // Day 1 becomes "Today"
    expect(result[1].label).to.equal('Tomorrow') // Day 2 becomes "Tomorrow"
  })
})
