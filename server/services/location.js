const joi = require('joi')
const { azureMapsKey, azureMapsUrl, allowInsecureTls } = require('../config')
const { getJson } = require('../util')
const util = require('util')
const { find, get } = require('./lib/azure-maps-results-parser')
const LocationSearchError = require('../location-search-error')

function locationSearchNotNeeded (searchTerm) {
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

function validateLocationResponse (response) {
  const azureMapsSchema = joi.object({
    summary: joi.object().required(),
    results: joi.array().required()
  }).unknown()

  const { error } = azureMapsSchema.validate(response, { abortEarly: false })
  if (error) {
    throw new LocationSearchError(`Azure Maps response (${JSON.stringify(response)}) does not match expected schema: ${error.message}`)
  }
}

async function getLocationResponse (query, maxResults) {
  const validatedQuery = validateSearchTerm(query)
  const emptyResponse = { summary: { numResults: 0 }, results: [] }

  if (locationSearchNotNeeded(validatedQuery)) {
    return emptyResponse
  }

  const encodedQuery = encodeURIComponent(validatedQuery)
  const url = util.format(azureMapsUrl, encodedQuery, maxResults, azureMapsKey)

  let locationData
  try {
    // Optional local-development escape hatch for corporate TLS interception.
    locationData = await getJson(url, { rejectUnauthorized: !allowInsecureTls })
  } catch (err) {
    throw new LocationSearchError(`Azure Maps error: ${err}`)
  }

  validateLocationResponse(locationData)

  return locationData
}

async function getLocationBySlug (locationSlug) {
  // inspection shows that for some slug searches (e.g. hoxne-eye-suffolk)
  // the desired result is not within the first 3 results so need a different
  // value. 5 seems to be an acceptable value.
  const MAX_RESULTS = 5

  const locationData = await getLocationResponse(locationSlug, MAX_RESULTS)
  return get(locationData, locationSlug)
}

async function findLocationByQuery (locationQuery) {
  const MAX_RESULTS = 3
  const locationData = await getLocationResponse(locationQuery, MAX_RESULTS)
  return find(locationData)
}

module.exports = {
  find: findLocationByQuery,
  get: getLocationBySlug
}
