const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const spikeTelem = require('../data/spikeTelem.json')
const nonSpikeTelem = require('../data/nonSpikeTelem.json')
const { formatName, toMarked, cleanseLocation, removeSpikes } = require('../../server/util')

lab.experiment('util', () => {
  lab.experiment('toMarked', () => {
    lab.test('Find text is marked', async () => {
      Code.expect(toMarked('This is some text to be marked', 'text')).to.equal('This is some <mark>text</mark> to be marked')
    })
    lab.test('Find text is marked when search term is a regex char', async () => {
      // note: this was required in the scenario where a single ( is used as a search term as the search
      // returns 2 river results containing the character ( which resulted in a template rendering
      // error ("SyntaxError: Invalid regular expression: /(()/: Unterminated group: (unknown path)").
      // A requirement to return no results for single character search side steps the template rendering
      // error but it seems prudent to escape charaters before passing them to the regex generator
      Code.expect(toMarked('This is some (text) to be marked', '(')).to.equal('This is some <mark>(</mark>text) to be marked')
    })
  })
  lab.experiment('cleanLocation', () => {
    lab.test('Find text is cleansed', async () => {
      Code.expect(cleanseLocation('This is some text to be cleansed', 'text')).to.equal('This is some text to be cleansed')
    })
    lab.test('Find text is cleansed when search term contains special character', async () => {
      Code.expect(cleanseLocation('This is some (text) to be cleansed <script>alert(\'TEST\')</script>', '(')).to.equal('This is some (text) to be cleansed scriptalert(\'TEST\')script')
    })
  })
  lab.experiment('remove spikes in telem', () => {
    lab.test('Removes spike in telem over 300m, should be 479 values returned', async () => {
      const telem = removeSpikes(spikeTelem)
      Code.expect(telem.length).to.equal(479)
    })
    lab.test('No spikes in telem all values under 300m, 480 values returned', async () => {
      const telem = removeSpikes(nonSpikeTelem)
      Code.expect(telem.length).to.equal(480)
    })
  })
  lab.experiment('formatName', () => {
    lab.experiment('Addresses', () => {
      lab.test('Property name removed from addresses', async () => {
        Code.expect(formatName('The Big House, The Avenue, Durham', 'Address')).to.equal('The Avenue, Durham')
      })
      lab.test('Property number removed from addresses', async () => {
        Code.expect(formatName('10 The Avenue, Durham', 'Address')).to.equal('The Avenue, Durham')
      })
    })
    lab.experiment('PopulatedPlaces', () => {
      lab.test('Repeating parts are removed', async () => {
        Code.expect(formatName('Middlesbrough, Middlesbrough', 'PopulatedPlace')).to.equal('Middlesbrough')
      })
      lab.test('Similar parts are not removed', async () => {
        Code.expect(formatName('Durham, County Durham', 'PopulatedPlace')).to.equal('Durham, County Durham')
      })
    })
    lab.experiment('Error handling', () => {
      lab.test('Fails gracefully with undefined name', async () => {
        Code.expect(formatName()).to.equal('')
      })
      lab.test('Defaults entity type to PopulatedPlace', async () => {
        // if this was treated like an address the Linthorpe would be stripped off
        Code.expect(formatName('Linthorpe, Middlesbrough')).to.equal('Linthorpe, Middlesbrough')
      })
    })
  })
})
