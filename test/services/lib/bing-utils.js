const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = Lab.script()
const { formatName } = require('../../../server/services/lib/bing-utils')

experiment('bing utils', () => {
  experiment('formatName', () => {
    test('Repeating parts are removed', async () => {
      expect(formatName('Middlesbrough, Middlesbrough')).to.equal('Middlesbrough')
    })
    test('Similar parts are not removed', async () => {
      expect(formatName('Durham, County Durham')).to.equal('Durham, County Durham')
    })
    test('City qualifier "City Of" is removed', async () => {
      expect(formatName('Bristol, City Of Bristol')).to.equal('Bristol')
    })
    test('City qualifier "City of" is removed (ie case insensitive)', async () => {
      expect(formatName('Bristol, City of Bristol')).to.equal('Bristol')
    })
    test('City qualifier "Greater" is removed', async () => {
      expect(formatName('London, Greater London')).to.equal('London')
    })
    test('City qualifier removed from neighbourhood', async () => {
      expect(formatName('Camberwell, London, Greater London')).to.equal('Camberwell, London')
    })
    experiment('Error handling', () => {
      test('Fails gracefully with undefined name', async () => {
        expect(formatName()).to.equal('')
      })
    })
  })
})
