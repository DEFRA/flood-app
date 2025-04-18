const { addBufferToBbox, formatName } = require('../../util')

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

function slugify (text = '') {
  return text.replace(/,/g, '').replace(/ /g, '-').toLowerCase()
}

async function bingResultsParser (bingData) {
  const set = bingData.resourceSets[0]
  if (set.estimatedTotal === 0) {
    return []
  }

  // following discussion with team, going to try out only high confidence
  // results. This should reduce spurious results.
  const allowedConfidences = ['high']

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

  function englandOnlyFilter (r) {
    if (r.entityType.toLowerCase() === 'admindivision1') {
      return englishCeremonialCounties.indexOf(r.name.toLowerCase()) >= 0
    }

    return r.address.adminDistrict.toLowerCase() === 'england'
  }

  const data = set.resources
    .filter(r => allowedConfidences.includes(r.confidence.toLowerCase()))
    .filter(r => allowedTypes.includes(r.entityType.toLowerCase()))
    .filter(r => englandOnlyFilter(r))
    .sort((a, b) =>
      allowedTypes.indexOf(a.entityType.toLowerCase()) -
      allowedTypes.indexOf(b.entityType.toLowerCase()))
    .sort((a, b) =>
      allowedConfidences.indexOf(a.confidence.toLowerCase()) -
      allowedConfidences.indexOf(b.confidence.toLowerCase()))[0]

  if (!data) {
    return []
  }

  const {
    bbox,
    point: { coordinates: center }
  } = data

  const name = formatName(data.name)

  // query is the value to use in a search box or the slug to replicate the
  // search and get the same result. If the bing format of the name (place
  // name + postcode) is used then some postcode searches which were
  // successful will subsequently fail to find a postcode with the same name
  // e.g TQ9 6JZ => Dartington, Totnes TQ9 6JZ => returns the postcode but
  // with a different name (Totnes, TQ9 6JZ, United Kingdom)
  // This causes problems with validity checking
  // Retained both name and query for display purposes for post codes
  // (even though name and query are the are the same for non-postcodes)
  const query = ['postcode1', 'postcode3'].includes(data.entityType.toLowerCase())
    ? data.address.postalCode
    : name

  const slug = slugify(query)

  // Reverse as Bing returns as [y (lat), x (long)]
  bbox.reverse()
  center.reverse()

  const isUK = data.address.countryRegionIso2 === 'GB'

  // const isEngland = await getIsEngland(center[0], center[1])

  const distanceInMetres = {
    '2k': 2000,
    '10k': 10000
  }

  // add buffer to place.bbox for stations search
  const bbox2k = addBufferToBbox(bbox, distanceInMetres['2k'])
  const bbox10k = addBufferToBbox(bbox, distanceInMetres['10k'])

  return [{
    name,
    slug,
    query,
    center,
    bbox2k,
    bbox10k,
    isUK,
    isEngland: { is_england: true }
  }]
}

module.exports = bingResultsParser
