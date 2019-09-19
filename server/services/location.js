const { bingKey } = require('../config')
const { getJson } = require('../util')
const floodServices = require('./flood')

async function find (location) {
  const query = encodeURIComponent(location)
  const url = `https://dev.virtualearth.net/REST/v1/Locations?query=${query},UK&userRegion=GB&include=ciso2&c=en-GB&maxResults=1&userIP=127.0.0.1&key=${bingKey}`
  // const url = `https://dev.virtualearth.net/REST/v1/Locations/UK/${query}?key=${bingKey}&maxResults=1&userIP=127.0.0.1`

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
  // This is a check to see if "no results" found, because search is biased to GB if a search term can't be matched
  // the service tends to return the UK with a medium confidence, so this is a good indication that no results were found
  const noConfidence = (data.confidence.toLowerCase() === 'medium' || data.confidence.toLowerCase() === 'low')
  if (data.entityType.toLowerCase() === 'countryregion' && noConfidence) {
    return
  }

  let {
    name,
    bbox,
    address: { formattedAddress: address },
    point: { coordinates: center }
  } = data

  // Reverse as Bing returns as [y (lat), x (long)]
  bbox.reverse()
  center.reverse()

  // Strip the "U.K" part of the address
  name = name.replace(', United Kingdom', '')

  // Dan Leech temporary addition to remove the duplicate city/town name
  if (name.split(',').length === 2) {
    var parts = name.toLowerCase().split(',')
    if (parts[0].trim() === parts[1].trim()) {
      name = name.substr(0, name.indexOf(','))
    }
  }

  const isEngland = await floodServices.getIsEngland(center[0], center[1])

  return {
    name,
    center,
    bbox,
    address,
    isEngland
  }
}

async function suggest (query) {
  // const url = `http://dev.virtualearth.net/REST/v1/Autosuggest?query=${query}&userLocation=<lat,long,confidence_radius>&userCircularMapView=<lat,long,radius>&userMapView=<nw_lat,nw_long,se_lat,se_long>&maxResults=5>&includeEntityTypes=<Place,Address,Business>&culture=<culture_code>&userRegion=<country_code>&countryFilter=<country_code_or_none>&key=<BingMapKey>`
  // const url = `https://dev.virtualearth.net/REST/v1/Autosuggest?query=${query}&maxResults=5&includeEntityTypes=Address,Place,Business&culture=en-GB&userRegion=GB&countryFilter=GB&key=${bingKey}`
  const url = `https://dev.virtualearth.net/REST/v1/Autosuggest?query=${query}&maxResults=5&includeEntityTypes=Place&culture=en-GB&userRegion=GB&countryFilter=GB&key=${bingKey}`

  let data = await getJson(url, true)

  // Check that the json is relevant
  if (!data.resourceSets || !data.resourceSets.length) {
    throw new Error('Invalid geocode results (no resourceSets)')
  }

  // Ensure we have some results
  const set = data.resourceSets[0]
  if (set.estimatedTotal === 0) {
    return
  }

  data = set.resources[0]

  return data.value.map(item => item.name || item.address.formattedAddress)
}

module.exports = { find, suggest }