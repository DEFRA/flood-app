const { addBufferToBbox, formatName, slugify } = require('../../util')

// source: https://en.wikipedia.org/wiki/Ceremonial_counties_of_England
// see also for a description of the difference between ceremonial and administrative counties
const englishCeremonialCounties =
  [
    'bedfordshire',
    'berkshire',
    'bristol',
    'buckinghamshire',
    'cambridgeshire',
    'cheshire',
    'city of london',
    'cornwall',
    'cumbria',
    'derbyshire',
    'devon',
    'dorset',
    'durham',
    'east riding of yorkshire',
    'east sussex',
    'essex',
    'gloucestershire',
    'greater london',
    'greater manchester',
    'hampshire',
    'herefordshire',
    'hertfordshire',
    'isle of wight',
    'kent',
    'lancashire',
    'leicestershire',
    'lincolnshire',
    'merseyside',
    'norfolk',
    'north yorkshire',
    'northamptonshire',
    'northumberland',
    'nottinghamshire',
    'oxfordshire',
    'rutland',
    'shropshire',
    'somerset',
    'south yorkshire',
    'staffordshire',
    'suffolk',
    'surrey',
    'tyne and wear',
    'warwickshire',
    'west midlands',
    'west sussex',
    'west yorkshire',
    'wiltshire',
    'worcestershire'
  ]

// note that allowedTypes also captures precedance rules for when multiple
// results are returned (e.g admindivision2 takes precedance over admindivision1)
const allowedTypes = [
  'postcode1',
  'postcode3',
  'admindivision1',
  'admindivision2',
  'populatedplace',
  'neighborhood'
]

const distanceInMetres = {
  '2k': 2000,
  '10k': 10000
}

const mapper = (r) => {
  const name = formatName(r.name)
  const bbox = r.bbox.reverse()
  // query is the value to use in a search box or the slug to replicate the
  // search and get the same result. If the bing format of the name (place
  // name + postcode) is used then some postcode searches which were
  // successful will subsequently fail to find a postcode with the same name
  // e.g TQ9 6JZ => Dartington, Totnes TQ9 6JZ => returns the postcode but
  // with a different name (Totnes, TQ9 6JZ, United Kingdom)
  // This causes problems with validity checking
  // Retained both name and query for display purposes for post codes
  // (even though name and query are the are the same for non-postcodes)
  const query = ['postcode1', 'postcode3'].includes(r.entityType.toLowerCase())
    ? r.address.postalCode
    : name

  return {
    name,
    query,
    slug: slugify(query),
    center: r.point.coordinates.reverse(),
    bbox2k: addBufferToBbox(bbox, distanceInMetres['2k']),
    bbox10k: addBufferToBbox(bbox, distanceInMetres['10k']),
    isUK: r.address.countryRegionIso2 === 'GB',
    isEngland: { is_england: true }
  }
}

const confidenceFilter = (r) => r.confidence.toLowerCase() === 'high'

const englandOnlyFilter = (r) => {
  if (r.entityType.toLowerCase() === 'admindivision1') {
    return englishCeremonialCounties.indexOf(r.name.toLowerCase()) >= 0
  }

  return r.address.adminDistrict?.toLowerCase() === 'england'
}

const allowedTypesFilter = (r) =>
  allowedTypes.includes(r.entityType.toLowerCase())

const baseFilter = (r) =>
  allowedTypesFilter(r) && englandOnlyFilter(r)

const typesSort = (a, b) =>
  allowedTypes.indexOf(a.entityType.toLowerCase()) -
  allowedTypes.indexOf(b.entityType.toLowerCase())

const removeDuplicatesFilter = (place, index, self) =>
  self.findIndex(p => p.slug === place.slug) === index

async function find (bingResponse) {
  const set = bingResponse.resourceSets[0]
  return set.estimatedTotal
    ? set.resources
      .filter(confidenceFilter)
      .filter(baseFilter)
      .sort(typesSort)
      .map(mapper)
      .filter(removeDuplicatesFilter)
    : []
}

async function get (bingResponse, slug) {
  const matchingSlugFilter = (r) => r.slug === slug
  const set = bingResponse.resourceSets[0]
  return set.estimatedTotal
    ? set.resources
      .filter(baseFilter)
      .sort(typesSort)
      .map(mapper)
      .filter(removeDuplicatesFilter)
      .filter(matchingSlugFilter)
    : []
}

module.exports = {
  find,
  get
}
