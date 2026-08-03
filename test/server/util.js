const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const sinon = require('sinon')
const spikeTelem = require('../data/spikeTelem.json')
const nonSpikeTelem = require('../data/nonSpikeTelem.json')
const { toMarked, cleanseLocation, removeSpikes, formatElapsedTime } = require('../../server/util')
const moment = require('moment-timezone')

describe('Util', () => {
  describe('toMarked', () => {
    it('should mark found text', async () => {
      expect(toMarked('This is some text to be marked', 'text')).to.equal('This is some <mark>text</mark> to be marked')
    })

    it('should mark text when search term is a regex char', async () => {
      // note: this was required in the scenario where a single ( is used as a search term as the search
      // returns 2 river results containing the character ( which resulted in a template rendering
      // error ("SyntaxError: Invalid regular expression: /(()/: Unterminated group: (unknown path)").
      // A requirement to return no results for single character search side steps the template rendering
      // error but it seems prudent to escape charaters before passing them to the regex generator
      expect(toMarked('This is some (text) to be marked', '(')).to.equal('This is some <mark>(</mark>text) to be marked')
    })
  })

  describe('cleanLocation', () => {
    it('should cleanse text', async () => {
      expect(cleanseLocation('This is some text to be cleansed', 'text')).to.equal('This is some text to be cleansed')
    })

    it('should cleanse text when search term contains special character', async () => {
      expect(cleanseLocation('This is some (text) to be cleansed <script>alert(\'TEST\')</script>', '(')).to.equal('This is some (text) to be cleansed scriptalert(\'TEST\')script')
    })
  })

  describe('remove spikes in telem', () => {
    it('should return 479 values and remove spike in telem over 300m', async () => {
      const telem = removeSpikes(spikeTelem)
      expect(telem.length).to.equal(479)
    })

    it('should return 480 values with no spikes in telem all values under 300md', async () => {
      const telem = removeSpikes(nonSpikeTelem)
      expect(telem.length).to.equal(480)
    })
  })

  describe('formatElapsedTime', () => {
    let clock

    beforeEach(() => {
      clock = sinon.useFakeTimers(moment.tz('2024-01-15T12:00:00', 'Europe/London').toDate())
    })

    afterEach(() => {
      clock.restore()
    })

    it('should return null when datetime is null', async () => {
      expect(formatElapsedTime(null)).to.equal(null)
    })

    it('should return undefined when datetime is undefined', async () => {
      expect(formatElapsedTime(undefined)).to.equal(undefined)
    })

    it('should return empty string when datetime is empty string', async () => {
      expect(formatElapsedTime('')).to.equal('')
    })

    it('should return pre-formatted string when datetime already ends with "ago"', async () => {
      const preFormatted = '30 minutes ago'
      expect(formatElapsedTime(preFormatted)).to.equal(preFormatted)
    })

    it('should return pre-formatted string when datetime ends with "ago" (case insensitive)', async () => {
      const preFormatted = '1 hour AGO'
      expect(formatElapsedTime(preFormatted)).to.equal(preFormatted)
    })

    it('should return original value when datetime is not valid ISO format', async () => {
      const invalidDate = 'not-a-date'
      expect(formatElapsedTime(invalidDate)).to.equal(invalidDate)
    })

    it('should return "X minutes ago" when datetime is less than 60 minutes old', async () => {
      const thirtyMinutesAgo = moment.tz('2024-01-15T11:30:00', 'Europe/London').toISOString()
      expect(formatElapsedTime(thirtyMinutesAgo)).to.equal('30 minutes ago')
    })

    it('should return "More than 1 hour ago" when datetime is 60 or more minutes old', async () => {
      const twoHoursAgo = moment.tz('2024-01-15T10:00:00', 'Europe/London').toISOString()
      expect(formatElapsedTime(twoHoursAgo)).to.equal('More than 1 hour ago')
    })

    it('should return "More than 1 hour ago" when datetime is exactly 1 hour old', async () => {
      const oneHourAgo = moment.tz('2024-01-15T11:00:00', 'Europe/London').toISOString()
      expect(formatElapsedTime(oneHourAgo)).to.equal('More than 1 hour ago')
    })

    it('should handle timestamps with whitespace in the datetime value', async () => {
      // Note: moment.ISO_8601 strict parsing does not trim input automatically,
      // so timestamps with leading/trailing spaces are treated as invalid
      const invalidWithWhitespace = '  2024-01-15T11:30:00Z  '
      expect(formatElapsedTime(invalidWithWhitespace)).to.equal(invalidWithWhitespace)
    })
  })
})
