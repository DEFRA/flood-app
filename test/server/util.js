const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const spikeTelem = require('../data/spikeTelem.json')
const nonSpikeTelem = require('../data/nonSpikeTelem.json')
const { toMarked, cleanseLocation, removeSpikes } = require('../../server/util')

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
})
