const { bingKeyLocation, bingUrl } = require('../config')
const { getJson, addBufferToBbox, formatName } = require('../util')
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
    throw new LocationSearchError(`Location search returned status: ${bingData.statusCode || 'unknown'}, message: ${bingData.statusDescription || 'not set'}`)
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

  if (data.confidence.toLowerCase() === 'low') {
    throw new LocationNotFoundError('Location search returned only low confidence results')
  }

  const {
    bbox,
    address: { formattedAddress: address },
    point: { coordinates: center }
  } = data

  let name = data.entityType === 'PopulatedPlace' ? data.address.locality : data.name
  name = formatName(name, data.address.addressLine)

  // Reverse as Bing returns as [y (lat), x (long)]
  bbox.reverse()
  center.reverse()

  const isUK = data.address.countryRegionIso2 === 'GB'
  const isScotlandOrNorthernIreland = isUK &&
  (data.address.adminDistrict === 'Northern Ireland' || data.address.adminDistrict === 'Scotland')

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
