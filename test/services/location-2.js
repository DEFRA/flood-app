'use strict'

const Lab = require('@hapi/lab')
const sinon = require('sinon')

const { expect } = require('@hapi/code')
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script()
const config = require('../../server/config')
const populatedPlace = require('./data/location/ashford-kent.json')
const adminDivision1 = require('./data/location/wales.json')

function setupStubs (context, locationData, isEngland = true) {
  context.stubs.getJson.onFirstCall().returns(locationData)
  context.stubs.getIsEngland.returns({ is_england: isEngland })
}

describe('location service', () => {
  let location, util, floodServices, context
  async function findLocation (searchTerm) {
    const result = await location.find(searchTerm).then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })
    return result
  }
  beforeEach(() => {
    // Deleting the requires and re-requiring is a bit hacky but was necessary as the tests
    // using callCount on the getJson stub were failing when running after any of the
    // location route tests
    // e.g  npx lab --verbose --id 3,33 --require dotenv/config test/routes/location.js test/services/location-2.js
    // Not got to the bottom of why that would be but this fixes it in the short term
    // Also, the order of doing the requires is important, you need to set up the stubs on the
    // dependent modules before requiring the subject under test (i.e. location)
    // This doesn't apply to config, probably because the stubs are fully set up here rather than
    // in the individual tests
    delete require.cache[require.resolve('../../server/services/flood')]
    delete require.cache[require.resolve('../../server/services/location')]
    delete require.cache[require.resolve('../../server/util')]
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
  it('should populate return values from the Bing response', async () => {
    setupStubs(context, populatedPlace)
    const result = await findLocation('Ashford')
    expect(result.length).to.equal(1)
    expect(result[0]).to.equal({
      name: 'Ashford, Kent',
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
      isScotlandOrNorthernIreland: false,
      isEngland: { is_england: true }
    })
  })
  it('should query bing using the provided search term', async () => {
    setupStubs(context, populatedPlace)
    const searchTerm = 'ashford'
    await findLocation(searchTerm)
    expect(context.stubs.getJson.callCount).to.equal(1)
    expect(context.stubs.getJson.args[0][0]).to.equal(`http://bing?query=${searchTerm}&key=12345`)
  })
  it('should not query Bing if search term is longer than 60 characters', async () => {
    setupStubs(context, {})
    const result = await findLocation('a'.repeat(61))
    expect(context.stubs.getJson.callCount).to.equal(0)
    expect(result.length).to.equal(0)
  })
  it('should not query Bing if search term contains only special characters', async () => {
    setupStubs(context, {})
    const result = await findLocation('!@£$%^&')
    expect(context.stubs.getJson.callCount).to.equal(0)
    expect(result.length).to.equal(0)
  })
  it('should not query Bing if search term is empty', async () => {
    setupStubs(context, {})
    const result = await findLocation('')
    expect(context.stubs.getJson.callCount).to.equal(0)
    expect(result.length).to.equal(0)
  })
  it('should filter out countries if Bing returns one', async () => {
    setupStubs(context, adminDivision1)
    const result = await findLocation('.wales')
    expect(context.stubs.getJson.callCount).to.equal(1)
    expect(result.length).to.equal(0)
  })
  describe('home nations test', () => {
    ['england', 'scotland', 'wales', 'northern ireland', 'united kingdom'].forEach(nation => {
      it(`should not query Bing for search term '${nation}'`, async () => {
        setupStubs(context, {})
        const result = await findLocation(nation)
        expect(context.stubs.getJson.callCount).to.equal(0)
        expect(result.length).to.equal(0)
      })
    })
  })
  describe('special character test', () => {
    ['<', '>'].forEach(character => {
      it(`should not query Bing if search term contains the special character ${character}`, async () => {
        setupStubs(context, {})
        const result = await findLocation(`test ${character}`)
        expect(context.stubs.getJson.callCount).to.equal(0)
        expect(result.length).to.equal(0)
      })
    })
  })
})
