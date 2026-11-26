'use strict'

const populatedPlace = require('./data/location/ashford-kent.json')
const adminDivision1 = require('./data/location/wales.json')

let LocationSearchError

function setupStubs (context, locationData) {
  context.stubs.getJson.mockImplementationOnce(() => locationData)
}

describe('Service - Location', () => {
  let location, util, context

  beforeEach(() => {
    jest.resetModules()
    LocationSearchError = require('../../server/location-search-error')

    const config = require('../../server/config')
    jest.replaceProperty(config, 'bingUrl', 'http://bing/Locations?query=%s&maxResults=%s&key=%s')
    jest.replaceProperty(config, 'bingKeyLocation', '12345')

    util = require('../../server/util')
    context = {
      stubs: {
        getJson: jest.spyOn(util, 'getJson').mockReturnValue(undefined)
      }
    }

    location = require('../../server/services/location')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('errors', () => {
    it('should throw error when search term is not a string', async () => {
      const result = await location.find(1).catch(err => err)

      expect(result).toBeInstanceOf(LocationSearchError)
      expect(result.message).toBe('ValidationError: location search term (1) "value" must be a string')
    })

    it('should throw a qualified error when Bing throws an error', async () => {
      context.stubs.getJson.mockImplementationOnce(() => {
        throw new Error('Some Bing Error')
      })

      const result = await location.find('test').catch(err => err)

      expect(result).toBeInstanceOf(LocationSearchError)
      expect(result.message).toContain('Bing error: Error: Some Bing Error')
    })

    it('should throw a qualified error when Bing returns a response which does not match the expected schema', async () => {
      context.stubs.getJson.mockImplementationOnce(() => ({}))

      const result = await location.find('test').catch(err => err)

      expect(result).toBeInstanceOf(LocationSearchError)
      expect(result.message).toBe('Bing response ({}) does not match expected schema: "statusCode" is required. "resourceSets" is required')
    })
  })

  describe('success', () => {
    it('should populate return values from the Bing response', async () => {
      setupStubs(context, populatedPlace)

      const result = await location.find('Ashford')

      expect(result.length).toBe(1)
      expect(result[0]).toEqual({
        name: 'Ashford, Kent',
        query: 'Ashford, Kent',
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

    it('should query bing using the provided search term and 3 maxResults', async () => {
      setupStubs(context, populatedPlace)

      const searchTerm = 'ashford'

      await location.find(searchTerm)

      expect(context.stubs.getJson).toHaveBeenCalledTimes(1)
      expect(context.stubs.getJson.mock.calls[0][0]).toBe(`http://bing/Locations?query=${searchTerm}&maxResults=3&key=12345`)
    })

    it('should not query Bing if search term is longer than 60 characters', async () => {
      setupStubs(context, {})

      const result = await location.find('a'.repeat(61))

      expect(context.stubs.getJson).toHaveBeenCalledTimes(0)
      expect(result.length).toBe(0)
    })

    it('should not query Bing if search term contains only special characters', async () => {
      setupStubs(context, {})

      const result = await location.find('!@£$%^&')

      expect(context.stubs.getJson).toHaveBeenCalledTimes(0)
      expect(result.length).toBe(0)
    })

    it('should query Bing if search term contains a mix of alphanumeric and special characters', async () => {
      setupStubs(context, populatedPlace)

      const result = await location.find('leeds !@£$%^&')

      expect(context.stubs.getJson).toHaveBeenCalledTimes(1)
      expect(result.length).toBe(1)
    })

    it('should not query Bing if search term is empty', async () => {
      setupStubs(context, {})

      const result = await location.find('')

      expect(context.stubs.getJson).toHaveBeenCalledTimes(0)
      expect(result.length).toBe(0)
    })

    it('should filter out countries', async () => {
      setupStubs(context, adminDivision1)

      const result = await location.find('.wales')

      expect(context.stubs.getJson).toHaveBeenCalledTimes(1)
      expect(result.length).toBe(0)
    })

    describe('confidence test', () => {
      [['high', 1], ['medium', 0], ['low', 0]].forEach(confidence => {
        it(`should return ${confidence[1]} result for confidence level '${confidence[0]}' when Bing returns a ${confidence[0]} result`, async () => {
          const clonePopulatedPlace = { ...populatedPlace }
          clonePopulatedPlace.resourceSets[0].resources[0].confidence = confidence[0]

          setupStubs(context, clonePopulatedPlace)

          const result = await location.find('test')
          expect(result.length).toEqual(confidence[1])
        })
      })
    })

    describe('home nations test', () => {
      ['england', 'scotland', 'wales', 'northern ireland', 'united kingdom'].forEach(nation => {
        it(`should not query Bing for search term '${nation}'`, async () => {
          setupStubs(context, {})

          const result = await location.find(nation)

          expect(context.stubs.getJson).toHaveBeenCalledTimes(0)
          expect(result.length).toBe(0)
        })
      })
    })

    describe('special character test', () => {
      ['<', '>'].forEach(character => {
        it(`should not query Bing if search term contains the special character ${character}`, async () => {
          setupStubs(context, {})

          const result = await location.find(`test ${character}`)

          expect(context.stubs.getJson).toHaveBeenCalledTimes(0)
          expect(result.length).toBe(0)
        })
      })
    })
  })

  describe('get by slug', () => {
    it('should return result matching slug', async () => {
      setupStubs(context, populatedPlace)
      const result = await location.get('ashford-kent')
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('Ashford, Kent')
    })

    it('should query bing using the provided slug and 5 maxResults', async () => {
      setupStubs(context, populatedPlace)
      const slug = 'ashford-slug'
      await location.get(slug)
      expect(context.stubs.getJson).toHaveBeenCalledTimes(1)
      expect(context.stubs.getJson.mock.calls[0][0]).toBe(`http://bing/Locations?query=${slug}&maxResults=5&key=12345`)
    })
    it('should strip the sector suffix from a postcode sector slug', async () => {
      setupStubs(context, populatedPlace)
      await location.get('tw1-3')
      expect(context.stubs.getJson.mock.calls[0][0]).toBe('http://bing/Locations?query=tw1&maxResults=5&key=12345')
    })

    it('should not strip a numeric suffix from a postcode-like slug that is not a sector', async () => {
      setupStubs(context, populatedPlace)
      await location.get('tw1-34')
      expect(context.stubs.getJson.mock.calls[0][0]).toBe('http://bing/Locations?query=tw1-34&maxResults=5&key=12345')
    })
  })

  describe('find by coordinates', () => {
    it('should throw if the bingUrl format does not support coordinate searches', async () => {
      jest.resetModules()
      const config = require('../../server/config')
      jest.replaceProperty(config, 'bingUrl', 'http://bing/search?query=%s&maxResults=%s&key=%s')
      LocationSearchError = require('../../server/location-search-error')
      location = require('../../server/services/location')

      await expect(location.find('51.5007,-0.1246')).rejects.toThrow(new LocationSearchError('Invalid bingUrl format for coordinate searches'))
    })

    it('should query Bing using coordinate path format and 3 maxResults', async () => {
      jest.resetModules()
      const config = require('../../server/config')
      jest.replaceProperty(config, 'bingUrl', 'http://bing/REST/v1/Locations?query=%s&maxResults=%s&key=%s')
      jest.replaceProperty(config, 'bingKeyLocation', '12345')

      util = require('../../server/util')
      context = {
        stubs: {
          getJson: jest.spyOn(util, 'getJson').mockReturnValue(undefined)
        }
      }

      location = require('../../server/services/location')

      const bingCoordinateResponse = {
        statusCode: 200,
        resourceSets: [{
          estimatedTotal: 1,
          resources: [{
            confidence: 'High',
            entityType: 'Address',
            name: '10 Downing Street',
            bbox: [-0.13, 51.50, -0.11, 51.52],
            point: { coordinates: [51.51, -0.12] },
            address: {
              adminDistrict: 'England',
              postalCode: 'SW1A 1AA',
              countryRegionIso2: 'GB'
            }
          }]
        }]
      }

      context.stubs.getJson.mockImplementationOnce(() => bingCoordinateResponse)

      await location.find('51.5007,-0.1246')

      expect(context.stubs.getJson).toHaveBeenCalledTimes(1)
      expect(context.stubs.getJson.mock.calls[0][0]).toBe('http://bing/REST/v1/Locations/51.5007,-0.1246?query=&maxResults=3&key=12345')
    })

    it('should return mapped location for England coordinate lookup', async () => {
      const bingCoordinateResponse = {
        statusCode: 200,
        resourceSets: [{
          estimatedTotal: 1,
          resources: [{
            confidence: 'High',
            entityType: 'Address',
            name: '10 Downing Street',
            bbox: [-0.13, 51.50, -0.11, 51.52],
            point: { coordinates: [51.51, -0.12] },
            address: {
              adminDistrict: 'England',
              postalCode: 'SW1A 1AA',
              countryRegionIso2: 'GB'
            }
          }]
        }]
      }

      context.stubs.getJson.mockImplementationOnce(() => bingCoordinateResponse)

      const result = await location.find('51.5007,-0.1246')

      expect(result.length).toBe(1)
      expect(result[0].name).toBe('10 Downing Street')
      expect(result[0].query).toBe('SW1A 1AA')
      expect(result[0].slug).toBe('sw1a-1aa')
      expect(result[0].isUK).toEqual(true)
      expect(result[0].isEngland).toEqual({ is_england: true })
    })

    it('should return an empty array for coordinate search', async () => {
      const bingCoordinateResponse = {
        statusCode: 200,
        resourceSets: [{
          estimatedTotal: 1,
          resources: [{
            confidence: 'High',
            entityType: 'Address',
            name: 'George Square',
            bbox: [-4.26, 55.85, -4.24, 55.87],
            point: { coordinates: [55.86, -4.25] },
            address: {
              adminDistrict: 'Scotland',
              district: 'Glasgow',
              locality: 'Glasgow',
              postalCode: 'G2 1DU',
              countryRegionIso2: 'GB'
            }
          }]
        }]
      }

      context.stubs.getJson.mockImplementationOnce(() => bingCoordinateResponse)

      const result = await location.find('55.8609,-4.2514')

      expect(result).toEqual([])
    })
  })

  describe('find then get round trip', () => {
    // Builds a fresh Bing resource for each call, because the parser reverses bbox and coordinates in place
    const resource = ({ name, entityType = 'PopulatedPlace', confidence = 'High', postalCode, adminDistrict = 'England' }) => ({
      bbox: [51.1, 0.8, 51.2, 0.9],
      name,
      point: { type: 'Point', coordinates: [51.15, 0.85] },
      address: { adminDistrict, countryRegionIso2: 'GB', postalCode, formattedAddress: name },
      confidence,
      entityType
    })

    const bingResponse = (resources) => ({
      statusCode: 200,
      resourceSets: [{ estimatedTotal: resources.length, resources }]
    })

    // Fake Bing: returns the resources registered for the exact query string it receives
    const fakeBing = (responsesByQuery) => {
      context.stubs.getJson.mockImplementation((url) => {
        const query = new URL(url).searchParams.get('query')
        const resources = (responsesByQuery[query] || []).map(resource)
        return bingResponse(resources)
      })
    }

    const queriesSentToBing = () => context.stubs.getJson.mock.calls.map(([url]) => {
      const params = new URL(url).searchParams
      return { query: params.get('query'), maxResults: params.get('maxResults') }
    })

    it.each([
      {
        description: 'a populated place',
        search: 'Chipping Campden',
        place: { name: 'Chipping Campden, Gloucestershire' },
        expectedName: 'Chipping Campden, Gloucestershire',
        expectedSlug: 'chipping-campden-gloucestershire'
      },
      {
        description: 'a place whose Bing name has repeated entries and a city qualifier',
        search: 'Camberwell',
        place: { name: 'Camberwell, London, London, Greater London', entityType: 'Neighborhood' },
        expectedName: 'Camberwell, London',
        expectedSlug: 'camberwell-london'
      },
      {
        description: 'an English ceremonial county',
        search: 'Devon',
        place: { name: 'Devon', entityType: 'AdminDivision1' },
        expectedName: 'Devon',
        expectedSlug: 'devon'
      },
      {
        description: 'a full postcode, where the slug is built from the postcode not the name',
        search: 'TQ9 6JZ',
        place: { name: 'Dartington, Totnes TQ9 6JZ', entityType: 'Postcode1', postalCode: 'TQ9 6JZ' },
        expectedName: 'Dartington, Totnes TQ9 6JZ',
        expectedSlug: 'tq9-6jz'
      }
    ])('should get back the same location from the slug returned by find for $description', async ({ search, place, expectedName, expectedSlug }) => {
      fakeBing({
        [search]: [place],
        [expectedSlug]: [place]
      })

      const found = await location.find(search)

      expect(found).toHaveLength(1)
      expect(found[0].name).toBe(expectedName)
      expect(found[0].slug).toBe(expectedSlug)

      const got = await location.get(found[0].slug)

      expect(got).toHaveLength(1)
      expect(got[0]).toEqual(found[0])
      expect(queriesSentToBing()).toEqual([
        { query: search, maxResults: '3' },
        { query: expectedSlug, maxResults: '5' }
      ])
    })

    it('should get the matching location from the slug even when Bing ranks it below other results with lower confidence', async () => {
      const hoxne = { name: 'Hoxne, Eye, Suffolk' }
      fakeBing({
        Hoxne: [hoxne],
        'hoxne-eye-suffolk': [
          { name: 'Eye, Suffolk' },
          { name: 'Hoxne Road, Eye, Suffolk', entityType: 'Neighborhood' },
          { ...hoxne, confidence: 'Medium' }
        ]
      })

      const found = await location.find('Hoxne')
      const got = await location.get(found[0].slug)

      expect(got).toHaveLength(1)
      expect(got[0].name).toBe('Hoxne, Eye, Suffolk')
    })

    it('should return no location from the slug when Bing does not return the place that find returned', async () => {
      fakeBing({
        Kington: [{ name: 'Kington, County of Herefordshire' }],
        'kington-county-of-herefordshire': [{ name: 'Kington, Herefordshire' }]
      })

      const found = await location.find('Kington')

      expect(found).toHaveLength(1)
      expect(found[0].slug).toBe('kington-county-of-herefordshire')

      const got = await location.get(found[0].slug)

      expect(got).toEqual([])
    })

    it('should not find a location when Bing only returns low confidence matches', async () => {
      fakeBing({
        Slad: [{ name: 'Slad, Gloucestershire', confidence: 'Low' }]
      })

      const found = await location.find('Slad')

      expect(found).toEqual([])
    })
  })
})
