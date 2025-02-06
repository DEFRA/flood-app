const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { experiment, it } = exports.lab = Lab.script()
const { formatName, slugify } = require('../../../server/services/lib/bing-utils')

experiment('bing utils', () => {
  experiment('formatName', () => {
    it('Repeating parts are removed', async () => {
      expect(formatName('Middlesbrough, Middlesbrough')).to.equal('Middlesbrough')
    })
    it('Similar parts are not removed', async () => {
      expect(formatName('Durham, County Durham')).to.equal('Durham, County Durham')
    })
    it('City qualifier "City Of" is removed', async () => {
      expect(formatName('Bristol, City Of Bristol')).to.equal('Bristol')
    })
    it('City qualifier "City of" is removed (ie case insensitive)', async () => {
      expect(formatName('Bristol, City of Bristol')).to.equal('Bristol')
    })
    it('City qualifier "Greater" is removed', async () => {
      expect(formatName('London, Greater London')).to.equal('London')
    })
    it('City qualifier removed from neighbourhood', async () => {
      expect(formatName('Camberwell, London, Greater London')).to.equal('Camberwell, London')
    })
    experiment('Error handling', () => {
      it('Fails gracefully with undefined name', async () => {
        expect(formatName()).to.equal('')
      })
    })
  })
  experiment('slugify', () => {
    it('Simple name is slugified', async () => {
      expect(slugify('Leeds, West Yorkshire')).to.equal('leeds-west-yorkshire')
    })
    it('Non-alphanumerics (!) are preserved', async () => {
      expect(slugify('Westward Ho!, Bideford, Devon')).to.equal('westward-ho!-bideford-devon')
    })
    it('Non-alphanumerics (\') are preserved', async () => {
      expect(slugify('Bishop\'s Stortford')).to.equal('bishop\'s-stortford')
    })
  })
})
