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
  lab.experiment('formatName', () => {
    lab.test('Repeating parts are removed', async () => {
      Code.expect(formatName('Durham, Durham')).to.equal('Durham')
    })
    lab.test('Similar parts are not removed', async () => {
      Code.expect(formatName('Durham, County Durham')).to.equal('Durham, County Durham')
    })
    lab.test('United Kingdom removed', async () => {
      Code.expect(formatName('Durham, United Kingdom')).to.equal('Durham')
    })
    lab.test('Address part removed', async () => {
      Code.expect(formatName('The Big House, Durham', 'The Big House')).to.equal('Durham')
    })
    lab.test('Duplicate but not repeating parts are not removed', async () => {
      // Note: not sure of an example which would occur in the real world example but included here for completeness
      Code.expect(formatName('Newcastle, Northumberland, Newcastle')).to.equal('Newcastle, Northumberland, Newcastle')
    })
    lab.test('Case mismatch is not considered duplicate', async () => {
      // Note: not expected to occur in the real world, see comments in formatName
      Code.expect(formatName('Durham, durham')).to.equal('Durham, durham')
    })
    lab.test('Fails gracefully with undefined name', async () => {
      Code.expect(formatName()).to.equal('')
    })
    lab.test('Removes spike in telem over 300m, should be 479 values returned', async () => {
      const telem = removeSpikes(spikeTelem)
      Code.expect(telem.length).to.equal(479)
    })
    lab.test('No spikes in telem all values under 300m, 480 values returned', async () => {
      const telem = removeSpikes(nonSpikeTelem)
      Code.expect(telem.length).to.equal(480)
    })
  })
})
