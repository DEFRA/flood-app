const { formatName, slugify } = require('../../../server/services/lib/bing-utils')

describe('bing utils', () => {
  describe('formatName', () => {
    it('Repeating parts are removed', async () => {
      expect(formatName('Middlesbrough, Middlesbrough')).toBe('Middlesbrough')
    })
    it('Similar parts are not removed', async () => {
      expect(formatName('Durham, County Durham')).toBe('Durham, County Durham')
    })
    it('City qualifier "City Of" is removed', async () => {
      expect(formatName('Bristol, City Of Bristol')).toBe('Bristol')
    })
    it('City qualifier "City of" is removed (ie case insensitive)', async () => {
      expect(formatName('Bristol, City of Bristol')).toBe('Bristol')
    })
    it('City qualifier "Greater" is removed', async () => {
      expect(formatName('London, Greater London')).toBe('London')
    })
    it('City qualifier removed from neighbourhood', async () => {
      expect(formatName('Camberwell, London, Greater London')).toBe('Camberwell, London')
    })
    describe('Error handling', () => {
      it('Fails gracefully with undefined name', async () => {
        expect(formatName()).toBe('')
      })
    })
  })
  describe('slugify', () => {
    it('Simple name is slugified', async () => {
      expect(slugify('Leeds, West Yorkshire')).toBe('leeds-west-yorkshire')
    })
    it('Non-alphanumerics (!) are preserved', async () => {
      expect(slugify('Westward Ho!, Bideford, Devon')).toBe('westward-ho!-bideford-devon')
    })
    it('Non-alphanumerics (\') are preserved', async () => {
      expect(slugify('Bishop\'s Stortford')).toBe('bishop\'s-stortford')
    })
    it('Returns an empty string when no name is given', async () => {
      expect(slugify()).toBe('')
    })
  })
})
