const joi = require('joi')
const { bingKeyLocation, bingUrl } = require('../config')
const { getJson } = require('../util')
const util = require('util')
const { find, get } = require('./lib/bing-results-parser')
const LocationSearchError = require('../location-search-error')

const MAX_BING_RESULTS = 5

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

async function getBingResponse (query) {
  const validatedQuery = validateSearchTerm(query)
  const emptyBingResponse = { resourceSets: [{ estimatedTotal: 0 }] }

  if (bingSearchNotNeeded(validatedQuery)) {
    return emptyBingResponse
  }

  const encodedQuery = encodeURIComponent(validatedQuery)
  const url = util.format(bingUrl, encodedQuery, MAX_BING_RESULTS, bingKeyLocation)

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
  const bingData = await getBingResponse(locationSlug)
  return get(bingData, locationSlug)
}

async function findLocationByQuery (locationQuery) {
  const bingData = await getBingResponse(locationQuery)
  return find(bingData)
}

module.exports = {
  find: findLocationByQuery,
  get: getLocationBySlug
}
