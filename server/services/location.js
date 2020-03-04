const { bingKey } = require('../config')
const { getJson, addBufferToBbox } = require('../util')
const floodServices = require('./flood')

async function find (location) {
  const query = encodeURIComponent(location)
  const url = `https://dev.virtualearth.net/REST/v1/Locations?query=${query},UK&userRegion=GB&include=ciso2&c=en-GB&maxResults=2&userIP=127.0.0.1&key=${bingKey}&includeEntityTypes=PopulatedPlace,AdminDivision2`

  let data = await getJson(url, true)

  if (data === undefined) {
    throw new Error('Invalid data returned from third party location search')
  }

  // Check that the json is relevant
  if (data === null || !data.resourceSets || !data.resourceSets.length) {
    throw new Error('Invalid geocode results (no resourceSets)')
  }

  // Ensure we have some results
  const set = data.resourceSets[0]
  if (set.estimatedTotal === 0) {
    return
  }

  data = set.resources[0]

  // Determine the confidence level of the result and return if it's not acceptable.
  if (data.confidence.toLowerCase() === 'low' || data.entityType.toLowerCase() === 'countryregion') {
    return
  }

  let {
    name,
    bbox,
    address: { formattedAddress: address },
    point: { coordinates: center }
  } = data

  // Replace name if only one item in result set and entityType is a populated place
  if (data.entityType === 'PopulatedPlace') {
    name = set.resources.length > 1 ? data.name : data.address.locality
  }

  // Reverse as Bing returns as [y (lat), x (long)]
  bbox.reverse()
  center.reverse()

  // Strip the "U.K" part of the address
  name = name.replace(', United Kingdom', '')

  // Temporary addition to remove the duplicate city/town name
  if (name.split(',').length === 2) {
    var parts = name.toLowerCase().split(',')
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

  // add on 2000m buffer to place.bbox for search
  bbox = addBufferToBbox(bbox, 2000)

  return {
    name,
    center,
    bbox,
    address,
    isEngland,
    isUK,
    isScotlandOrNorthernIreland
  }
}

module.exports = { find }
