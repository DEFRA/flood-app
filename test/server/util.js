const spikeTelem = require('../data/spikeTelem.json')
const nonSpikeTelem = require('../data/nonSpikeTelem.json')
const { toMarked, cleanseLocation, removeSpikes, formatElapsedTime, toFixed, formatValue, formatDate } = require('../../server/util')
const moment = require('moment-timezone')

describe('Util', () => {
  describe('toMarked', () => {
    it('should mark found text', async () => {
      expect(toMarked('This is some text to be marked', 'text')).toBe('This is some <mark>text</mark> to be marked')
    })

    it('should mark text when search term is a regex char', async () => {
      // note: this was required in the scenario where a single ( is used as a search term as the search
      // returns 2 river results containing the character ( which resulted in a template rendering
      // error ("SyntaxError: Invalid regular expression: /(()/: Unterminated group: (unknown path)").
      // A requirement to return no results for single character search side steps the template rendering
      // error but it seems prudent to escape charaters before passing them to the regex generator
      expect(toMarked('This is some (text) to be marked', '(')).toBe('This is some <mark>(</mark>text) to be marked')
    })
  })

  describe('cleanLocation', () => {
    it('should cleanse text', async () => {
      expect(cleanseLocation('This is some text to be cleansed', 'text')).toBe('This is some text to be cleansed')
    })

    it('should cleanse text when search term contains special character', async () => {
      expect(cleanseLocation('This is some (text) to be cleansed <script>alert(\'TEST\')</script>', '(')).toBe('This is some (text) to be cleansed scriptalert(\'TEST\')script')
    })
  })

  describe('remove spikes in telem', () => {
    it('should return 479 values and remove spike in telem over 300m', async () => {
      const telem = removeSpikes(spikeTelem)
      expect(telem.length).toBe(479)
    })

    it('should return 480 values with no spikes in telem all values under 300md', async () => {
      const telem = removeSpikes(nonSpikeTelem)
      expect(telem.length).toBe(480)
    })
  })

  describe('formatElapsedTime', () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: moment.tz('2024-01-15T12:00:00', 'Europe/London').toDate() })
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return null when datetime is null', async () => {
      expect(formatElapsedTime(null)).toEqual(null)
    })

    it('should return undefined when datetime is undefined', async () => {
      expect(formatElapsedTime(undefined)).toEqual(undefined)
    })

    it('should return empty string when datetime is empty string', async () => {
      expect(formatElapsedTime('')).toBe('')
    })

    it('should return pre-formatted string when datetime already ends with "ago"', async () => {
      const preFormatted = '30 minutes ago'
      expect(formatElapsedTime(preFormatted)).toEqual(preFormatted)
    })

    it('should return pre-formatted string when datetime ends with "ago" (case insensitive)', async () => {
      const preFormatted = '1 hour AGO'
      expect(formatElapsedTime(preFormatted)).toEqual(preFormatted)
    })

    it('should return original value when datetime is not valid ISO format', async () => {
      const invalidDate = 'not-a-date'
      expect(formatElapsedTime(invalidDate)).toEqual(invalidDate)
    })

    it('should return "X minutes ago" when datetime is less than 60 minutes old', async () => {
      const thirtyMinutesAgo = moment.tz('2024-01-15T11:30:00', 'Europe/London').toISOString()
      expect(formatElapsedTime(thirtyMinutesAgo)).toBe('30 minutes ago')
    })

    it('should return "More than 1 hour ago" when datetime is 60 or more minutes old', async () => {
      const twoHoursAgo = moment.tz('2024-01-15T10:00:00', 'Europe/London').toISOString()
      expect(formatElapsedTime(twoHoursAgo)).toBe('More than 1 hour ago')
    })

    it('should return "More than 1 hour ago" when datetime is exactly 1 hour old', async () => {
      const oneHourAgo = moment.tz('2024-01-15T11:00:00', 'Europe/London').toISOString()
      expect(formatElapsedTime(oneHourAgo)).toBe('More than 1 hour ago')
    })

    it('should handle timestamps with whitespace in the datetime value', async () => {
      // Note: moment.ISO_8601 strict parsing does not trim input automatically,
      // so timestamps with leading/trailing spaces are treated as invalid
      const invalidWithWhitespace = '  2024-01-15T11:30:00Z  '
      expect(formatElapsedTime(invalidWithWhitespace)).toEqual(invalidWithWhitespace)
    })
  })

  describe('toFixed', () => {
    it('should return an error message for a non-numeric value', () => {
      expect(toFixed('abc', 2)).toBe('Invalid input. Please provide a valid number string.')
    })

    it('should round a numeric string to the given decimal places', () => {
      expect(toFixed('1.236', 2)).toBe('1.24')
    })
  })

  describe('formatValue', () => {
    it('should round to 1 decimal place', () => {
      expect(formatValue(1.26)).toBe('1.3')
      expect(formatValue(2)).toBe('2.0')
    })
  })

  describe('formatDate', () => {
    it('should use the default format when none is given', () => {
      expect(formatDate('2024-01-15T13:05:00Z')).toBe('15/1/24 1:05pm')
    })
  })
})
