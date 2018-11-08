const { bingKey } = require('../config')
const { getJson } = require('../util')

async function find (location) {
  const query = encodeURIComponent(location)
  // const url = `http://dev.virtualearth.net/REST/v1/Locations?query=${query}&include=ciso2&c=en-GB&maxResults=1&userIP=127.0.0.1&key=${bingKey}`
  const url = `https://dev.virtualearth.net/REST/v1/Locations/UK/${query}?key=${bingKey}&maxResults=1&userIP=127.0.0.1`

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

  return {
    name,
    center,
    bbox,
    address
  }
}

async function suggest (query) {
  // const url = `http://dev.virtualearth.net/REST/v1/Autosuggest?query=${query}&userLocation=<lat,long,confidence_radius>&userCircularMapView=<lat,long,radius>&userMapView=<nw_lat,nw_long,se_lat,se_long>&maxResults=5>&includeEntityTypes=<Place,Address,Business>&culture=<culture_code>&userRegion=<country_code>&countryFilter=<country_code_or_none>&key=<BingMapKey>`
  const url = `https://dev.virtualearth.net/REST/v1/Autosuggest?query=${query}&maxResults=5&includeEntityTypes=Address,Place,Business&culture=en-GB&userRegion=GB&countryFilter=GB&key=${bingKey}`

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

  return data.value.map(item => item.address.formattedAddress)
}

module.exports = { find, suggest }
