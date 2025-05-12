const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const spikeTelem = require('../data/spikeTelem.json')
const nonSpikeTelem = require('../data/nonSpikeTelem.json')
const { formatName, toMarked, cleanseLocation, removeSpikes } = require('../../server/util')

describe('Util', () => {
  describe('toMarked', () => {
    it('should find text that is marked', async () => {
      expect(toMarked('This is some text to be marked', 'text')).to.equal('This is some <mark>text</mark> to be marked')
    })

    it('should find text that is marked when search term is a regex char', async () => {
      // note: this was required in the scenario where a single ( is used as a search term as the search
      // returns 2 river results containing the character ( which resulted in a template rendering
      // error ("SyntaxError: Invalid regular expression: /(()/: Unterminated group: (unknown path)").
      // A requirement to return no results for single character search side steps the template rendering
      // error but it seems prudent to escape charaters before passing them to the regex generator
      expect(toMarked('This is some (text) to be marked', '(')).to.equal('This is some <mark>(</mark>text) to be marked')
    })
  })

  describe('cleanLocation', () => {
    it('should find text that is cleansed', async () => {
      expect(cleanseLocation('This is some text to be cleansed', 'text')).to.equal('This is some text to be cleansed')
    })

    it('should find text that is cleansed when search term contains special character', async () => {
      expect(cleanseLocation('This is some (text) to be cleansed <script>alert(\'TEST\')</script>', '(')).to.equal('This is some (text) to be cleansed scriptalert(\'TEST\')script')
    })
  })

  describe('remove spikes in telem', () => {
    it('should remove spike in telem over 300m and return 479 values', async () => {
      const telem = removeSpikes(spikeTelem)
      expect(telem.length).to.equal(479)
    })

    it('should contain no spikes in telem all values under 300m and return 480 values', async () => {
      const telem = removeSpikes(nonSpikeTelem)
      expect(telem.length).to.equal(480)
    })
  })

  describe('formatName', () => {
    it('should remove repeating parts', async () => {
      expect(formatName('Middlesbrough, Middlesbrough')).to.equal('Middlesbrough')
    })

    it('should not remove similar parts', async () => {
      expect(formatName('Durham, County Durham')).to.equal('Durham, County Durham')
    })

    it('should remove city qualifier "City Of"', async () => {
      expect(formatName('Bristol, City Of Bristol')).to.equal('Bristol')
      expect(formatName('Bristol, City of Bristol')).to.equal('Bristol')
    })

    it('should remove City qualifier "Greater"', async () => {
      expect(formatName('London, Greater London')).to.equal('London')
    })

    it('should remove City qualifier from neighbourhood', async () => {
      expect(formatName('Camberwell, London, Greater London')).to.equal('Camberwell, London')
    })

    it('should fail gracefully with undefined name', async () => {
      expect(formatName()).to.equal('')
    })
  })
})
