'use strict'

const Lab = require('@hapi/lab')
const sinon = require('sinon')

const { expect } = require('@hapi/code')
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script()
const populatedPlace = require('./data/location/ashford-kent.json')
const adminDivision1 = require('./data/location/wales.json')
const LocationSearchError = require('../../server/location-search-error')
const flushAppRequireCache = require('../lib/flush-app-require-cache')

function setupStubs (context, locationData, isEngland = true) {
  context.stubs.getJson.onFirstCall().returns(locationData)
  context.stubs.getIsEngland.returns({ is_england: isEngland })
}

describe('location service', () => {
  let location, util, floodServices, context
  beforeEach(() => {
    flushAppRequireCache()
    const config = require('../../server/config')
    sinon.stub(config, 'bingUrl').value('http://bing?query=%s&key=%s')
    sinon.stub(config, 'bingKeyLocation').value('12345')
    util = require('../../server/util')
    floodServices = require('../../server/services/flood')
    context = {
      stubs: {
        getJson: sinon.stub(util, 'getJson'),
        getIsEngland: sinon.stub(floodServices, 'getIsEngland')
      }
    }
    location = require('../../server/services/location')
  })
  afterEach(async () => {
    await sinon.restore()
  })
  describe('sad path', () => {
    it('should throw error when search term is not a string', async () => {
      const result = await expect(location.find(1)).to.reject()
      expect(result).to.be.an.instanceOf(LocationSearchError)
      expect(result.message).to.equal('ValidationError: location search term (1) "value" must be a string')
    })
    it('should throw a qualified error when Bing throws an error', async () => {
      context.stubs.getJson.onFirstCall().throws('Some Bing Error')
      const result = await expect(location.find('test')).to.reject()
      expect(result).to.be.an.instanceOf(LocationSearchError)
      expect(result.message).to.contain('Bing error: Some Bing Error')
    })
    it('should throw a qualified error when Bing returns a response which does not match the expected schema', async () => {
      context.stubs.getJson.onFirstCall().returns({})
      const result = await expect(location.find('test')).to.reject()
      expect(result).to.be.an.instanceOf(LocationSearchError)
      expect(result.message).to.equal('Bing response ({}) does not match expected schema: "statusCode" is required. "resourceSets" is required')
    })
  })
  describe('happy path', () => {
    it('should populate return values from the Bing response', async () => {
      setupStubs(context, populatedPlace)
      const result = await location.find('Ashford')
      expect(result.length).to.equal(1)
      expect(result[0]).to.equal({
        name: 'Ashford, Kent',
        slug: 'ashford-kent',
        center: [0.87279475, 51.14772797],
        bbox2k: [
          0.80935719234919,
          51.106071366450024,
          0.9551791288139874,
          51.19515238842755
        ],
        bbox10k: [
          0.6945958802395501,
          51.034125753112406,
          1.0699404409236273,
          51.267098001671634
        ],
        isUK: true,
        isEngland: { is_england: true }
      })
    })
    it('should query bing using the provided search term', async () => {
      setupStubs(context, populatedPlace)
      const searchTerm = 'ashford'
      await location.find(searchTerm)
      expect(context.stubs.getJson.callCount).to.equal(1)
      expect(context.stubs.getJson.args[0][0]).to.equal(`http://bing?query=${searchTerm}&key=12345`)
    })
    it('should not query Bing if search term is longer than 60 characters', async () => {
      setupStubs(context, {})
      const result = await location.find('a'.repeat(61))
      expect(context.stubs.getJson.callCount).to.equal(0)
      expect(result.length).to.equal(0)
    })
    it('should not query Bing if search term contains only special characters', async () => {
      setupStubs(context, {})
      const result = await location.find('!@£$%^&')
      expect(context.stubs.getJson.callCount).to.equal(0)
      expect(result.length).to.equal(0)
    })
    it('should not query Bing if search term is empty', async () => {
      setupStubs(context, {})
      const result = await location.find('')
      expect(context.stubs.getJson.callCount).to.equal(0)
      expect(result.length).to.equal(0)
    })
    it('should filter out countries', async () => {
      setupStubs(context, adminDivision1)
      const result = await location.find('.wales')
      expect(context.stubs.getJson.callCount).to.equal(1)
      expect(result.length).to.equal(0)
    })
    describe('confidence test', () => {
      [['high', 1], ['medium', 1], ['low', 0]].forEach(confidence => {
        it(`should return ${confidence[1]} result for confidence level '${confidence[0]}' when Bing returns a ${confidence[0]} result`, async () => {
          const clonePopulatedPlace = { ...populatedPlace }
          clonePopulatedPlace.resourceSets[0].resources[0].confidence = confidence[0]
          setupStubs(context, clonePopulatedPlace)
          const result = await location.find('test')
          expect(result.length).to.equal(confidence[1])
        })
      })
    })
    describe('home nations test', () => {
      ['england', 'scotland', 'wales', 'northern ireland', 'united kingdom'].forEach(nation => {
        it(`should not query Bing for search term '${nation}'`, async () => {
          setupStubs(context, {})
          const result = await location.find(nation)
          expect(context.stubs.getJson.callCount).to.equal(0)
          expect(result.length).to.equal(0)
        })
      })
    })
    describe('special character test', () => {
      ['<', '>'].forEach(character => {
        it(`should not query Bing if search term contains the special character ${character}`, async () => {
          setupStubs(context, {})
          const result = await location.find(`test ${character}`)
          expect(context.stubs.getJson.callCount).to.equal(0)
          expect(result.length).to.equal(0)
        })
      })
    })
  })
})
