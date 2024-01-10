const { bingKeyLocation, bingUrl } = require('../config')
const { getJson } = require('../util')
const util = require('util')
const bingResultsParser = require('./lib/bing-results-parser')
const LocationSearchError = require('../location-search-error')
const floodServices = require('./flood')

async function find (location) {
  const query = encodeURIComponent(location)
  const url = util.format(bingUrl, query, bingKeyLocation)

  let bingData
  try {
    bingData = await getJson(url, true)
  } catch (err) {
    throw new LocationSearchError(`Bing error: ${err}`)
  }

  // At this point we expect to have received a 200 status code from location search api call
  // but check status code within payload to ensure valid.

  if (!bingData || bingData.length === 0) {
    throw new LocationSearchError('Missing or corrupt contents from location search')
  }

  // Check for OK status returned
  if (bingData.statusCode !== 200) {
    throw new LocationSearchError(`Location search returned status: ${bingData.statusCode || 'unknown'}, message: ${bingData.statusDescription || 'not set'}`)
  }

  // Check that the json is relevant
  if (!bingData.resourceSets || !bingData.resourceSets.length) {
    throw new LocationSearchError('Invalid geocode results (no resourceSets)')
  }

  return bingResultsParser(bingData, floodServices.getIsEngland)
}

module.exports = { find }
