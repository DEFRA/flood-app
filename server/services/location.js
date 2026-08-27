const joi = require('joi')
const { bingKeyLocation, bingUrl } = require('../config')
const { getJson } = require('../util')
const util = require('util')
const { find, get } = require('./lib/bing-results-parser')
const LocationSearchError = require('../location-search-error')
const { COORDINATE_PATTERN } = require('../constants')

function bingSearchNotNeeded (searchTerm) {
  const mustNotMatch = /[<>]|^england$|^scotland$|^wales$|^united kingdom$|^northern ireland$/i
  const mustMatch = /[a-zA-Z0-9]/
  return searchTerm.match(mustNotMatch) || !searchTerm.match(mustMatch) || searchTerm.length > 60
}

function validateSearchTerm (searchTerm) {
  const searchTermSchema = joi.string().trim().allow('')
  const { error, value: validatedLocation } = searchTermSchema.validate(searchTerm)
  if (error) {
    throw new LocationSearchError(`ValidationError: location search term (${searchTerm}) ${error.message}`)
  }
  return validatedLocation
}

function validateBingResponse (response) {
  const bingSchema = joi.object({
    statusCode: joi.number().valid(200).required(),
    resourceSets: joi.array().items(joi.object()).min(1).required()
  }).unknown()

  const { error } = bingSchema.validate(response, { abortEarly: false })
  if (error) {
    throw new LocationSearchError(`Bing response (${JSON.stringify(response)}) does not match expected schema: ${error.message}`)
  }
}

function injectCoordsIntoURL (url, coords) {
  const [base, params] = url.split('Locations?')

  if (!params) {
    throw new LocationSearchError('Invalid bingUrl format for coordinate searches')
  }

  const normalisedParams = params.replace(/query=%s,GB(?=&|$)/, 'query=%s')
  return `${base}Locations/${coords}?${normalisedParams}`
}

/**
 * Call the external Bing API to retrieve a list of locations based on the search term provided.
 * @param {string} query already validated search term
 * @param {number} maxBingResults
 * @param {boolean} isCoordinateQuery
 * @returns {Promise<Object>}
 */
async function getBingResponse (query, maxBingResults, isCoordinateQuery) {
  const emptyBingResponse = { resourceSets: [{ estimatedTotal: 0 }] }
  if (bingSearchNotNeeded(query)) {
    return emptyBingResponse
  }

  const encodedQuery = encodeURIComponent(query)

  const url = isCoordinateQuery // a coordinate query has a different URL structure
    ? util.format(injectCoordsIntoURL(bingUrl, query), '', maxBingResults, bingKeyLocation)
    : util.format(bingUrl, encodedQuery, maxBingResults, bingKeyLocation)

  let bingData
  try {
    bingData = await getJson(url, true)
  } catch (err) {
    throw new LocationSearchError(`Bing error: ${err}`)
  }

  validateBingResponse(bingData)

  return bingData
}

async function getLocationBySlug (locationSlug) {
  // inspection shows that for some slug searches (e.g. hoxne-eye-suffolk)
  // the desired result is not within the first 3 results so need a different
  // value. 5 seems to be an acceptable value.
  const MAX_BING_RESULTS = 5
  const validatedSlugQuery = validateSearchTerm(locationSlug)
  const bingData = await getBingResponse(validatedSlugQuery, MAX_BING_RESULTS, false)
  return get(bingData, validatedSlugQuery)
}

async function findLocationByQuery (locationQuery) {
  const MAX_BING_RESULTS = 3
  // determine if the query is a coordinate query (e.g. 51.5074,-0.1278) as this needs to be processed differently to a text search

  const validatedQuery = validateSearchTerm(locationQuery)
  const isCoordinateQuery = COORDINATE_PATTERN.test(validatedQuery)

  const bingData = await getBingResponse(validatedQuery, MAX_BING_RESULTS, isCoordinateQuery)
  return find(bingData, isCoordinateQuery)
}

module.exports = {
  find: findLocationByQuery,
  get: getLocationBySlug
}
