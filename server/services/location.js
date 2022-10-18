const { bingKeyLocation, bingUrl } = require('../config')
const { getJson, addBufferToBbox } = require('../util')
const floodServices = require('./flood')
const util = require('util')
const LocationSearchError = require('../location-search-error')
const LocationNotFoundError = require('../location-not-found-error')

async function find (location) {
  const query = encodeURIComponent(location)
  const url = util.format(bingUrl, query, bingKeyLocation)

  let bingData
  try {
    bingData = await getJson(url, true)
  } catch (err) {
    console.error(err)
    throw err
  }

  // At this point we expect to have received a 200 status code from location search api call
  // but check status code within payload to ensure valid.

  if (!bingData || bingData.length === 0) {
    throw new LocationSearchError('Missing or corrupt contents from location search')
  }

  // Check for OK status returned
  if (bingData.statusCode !== 200) {
    throw new LocationSearchError(`Location search returned status: ${bingData.statusCode || 'unknown'}, message: ${bingData.description || 'not set'}`)
  }

  // Check that the json is relevant
  if (!bingData.resourceSets || !bingData.resourceSets.length) {
    throw new LocationNotFoundError('Invalid geocode results (no resourceSets)')
  }

  // Ensure we have some results
  const set = bingData.resourceSets[0]
  if (set.estimatedTotal === 0) {
    throw new LocationNotFoundError('Location search returned no results')
  }

  const data = set.resources[0]

  // Determine the confidence level of the result and return if it's not acceptable.
  if (data.confidence.toLowerCase() === 'low' || data.entityType.toLowerCase() === 'countryregion') {
    throw new LocationNotFoundError('Location search returned low confidence results or only country region')
  }

  const {
    bbox,
    address: { formattedAddress: address },
    point: { coordinates: center }
  } = data

  let name = data.entityType === 'PopulatedPlace' ? data.address.locality : data.name

  // Reverse as Bing returns as [y (lat), x (long)]
  bbox.reverse()
  center.reverse()

  // Strip the "U.K" part of the address
  name = name.replace(', United Kingdom', '')

  // Temporary addition to remove the duplicate city/town name
  if (name.split(',').length === 2) {
    const parts = name.toLowerCase().split(',')
    if (parts[0].trim() === parts[1].trim()) {
      name = name.substr(0, name.indexOf(','))
    }
  }

  const isUK = data.address.countryRegionIso2 === 'GB'
  const isScotlandOrNorthernIreland = isUK &&
  (data.address.adminDistrict === 'Northern Ireland' || data.address.adminDistrict === 'Scotland')

  // Strip out addressLine to make address name returned more ambiguous as we're not giving property specific information
  if (data.address.addressLine && name.indexOf(data.address.addressLine) > -1) {
    name = name.replace(data.address.addressLine, '')
    if (name.slice(0, 2) === ', ') {
      name = name.slice(2, name.length)
    }
  }

  const isEngland = await floodServices.getIsEngland(center[0], center[1])

  // add on 2000m buffer to place.bbox for warnings and alerts search
  const bbox2k = addBufferToBbox(bbox, 2000)
  // add on 10000m buffer to place.bbox for stations search
  const bbox10k = addBufferToBbox(bbox, 10000)

  return {
    name,
    center,
    bbox2k,
    bbox10k,
    address,
    isEngland,
    isUK,
    isScotlandOrNorthernIreland
  }
}

module.exports = { find }
