const { addBufferToBbox, formatName, slugify } = require('./bing-utils')

// Ordered by precedence (postcode first, then county, district, town, neighbourhood)
const allowedEntityTypes = [
  'postalcodearea',
  'countrysecondarysubdivision',
  'countrytertiarysubdivision',
  'municipality',
  'municipalitysubdivision',
  'neighbourhood'
]

const distanceInMetres = {
  '2k': 2000,
  '10k': 10000
}

function getNameFromResult (r) {
  const { address } = r
  const entityType = r.entityType?.toLowerCase()

  if (entityType === 'postalcodearea') {
    return address.postalCode || address.freeformAddress
  }

  if (entityType === 'municipality') {
    const parts = [address.municipality, address.countrySecondarySubdivision].filter(Boolean)
    return formatName(parts.join(', '))
  }

  if (entityType === 'municipalitysubdivision' || entityType === 'neighbourhood') {
    const parts = [address.localName || address.municipalitySubdivision, address.municipality, address.countrySecondarySubdivision].filter(Boolean)
    return formatName(parts.join(', '))
  }

  if (entityType === 'countrysecondarysubdivision') {
    return formatName(address.countrySecondarySubdivision || address.freeformAddress)
  }

  if (entityType === 'countrytertiarysubdivision') {
    return formatName(address.countryTertiarySubdivision || address.freeformAddress)
  }

  // Fallback: strip country/subdivision suffixes from freeformAddress
  const cleaned = (address.freeformAddress || '')
    .replace(/,\s*(England|Wales|Scotland|Northern Ireland|United Kingdom)$/gi, '')
    .trim()
  return formatName(cleaned)
}

function getBboxFromResult (r) {
  if (!r.boundingBox) {
    // Fall back to a small box around the point
    const lat = r.position.lat
    const lon = r.position.lon
    return [lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01]
  }
  const { topLeftPoint, btmRightPoint } = r.boundingBox
  // Convert to [west, south, east, north]
  return [topLeftPoint.lon, btmRightPoint.lat, btmRightPoint.lon, topLeftPoint.lat]
}

const mapper = (r) => {
  const name = getNameFromResult(r)
  const isPostcode = r.entityType?.toLowerCase() === 'postalcodearea'
  const query = isPostcode ? r.address.postalCode : name

  return {
    name,
    query,
    slug: slugify(query),
    center: [r.position.lon, r.position.lat],
    bbox2k: addBufferToBbox(getBboxFromResult(r), distanceInMetres['2k']),
    bbox10k: addBufferToBbox(getBboxFromResult(r), distanceInMetres['10k']),
    isUK: r.address.countryCode === 'GB',
    isEngland: { is_england: true }
  }
}

const allowedTypesFilter = (r) =>
  allowedEntityTypes.includes(r.entityType?.toLowerCase())

const englandOnlyFilter = (r) =>
  r.address.countrySubdivisionName?.toLowerCase() === 'england'

const baseFilter = (r) =>
  allowedTypesFilter(r) && englandOnlyFilter(r)

const typesSort = (a, b) =>
  allowedEntityTypes.indexOf(a.entityType?.toLowerCase()) -
  allowedEntityTypes.indexOf(b.entityType?.toLowerCase())

const removeDuplicatesFilter = (place, index, self) =>
  self.findIndex(p => p.slug === place.slug) === index

async function find (azureResponse) {
  const results = azureResponse.results || []
  return results.length
    ? results
      .filter(baseFilter)
      .sort(typesSort)
      .map(mapper)
      .filter(removeDuplicatesFilter)
    : []
}

async function get (azureResponse, slug) {
  const matchingSlugFilter = (r) => r.slug === slug
  const results = azureResponse.results || []
  return results.length
    ? results
      .filter(baseFilter)
      .sort(typesSort)
      .map(mapper)
      .filter(removeDuplicatesFilter)
      .filter(matchingSlugFilter)
    : []
}

module.exports = { find, get }
