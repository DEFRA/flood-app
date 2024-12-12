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

async function bingResultsParser (bingData, getIsEngland) {
  const set = bingData.resourceSets[0]
  if (set.estimatedTotal === 0) {
    return []
  }

  const allowedConfidences = ['high', 'medium']

  // note that allowedTypes also captures precedance rules for when multiple
  // results are returned (e.g admindivision2 takes precedance over admindivision1)
  const allowedTypes = [
    'postcode1',
    'postcode3',
    'neighborhood',
    'populatedplace',
    'admindivision2',
    'admindivision1',
    'religiousstructure',
    'roadblock'
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

  const name = formatName(data.name, data.entityType)

  // Reverse as Bing returns as [y (lat), x (long)]
  bbox.reverse()
  center.reverse()

  const isUK = data.address.countryRegionIso2 === 'GB'
  const isScotlandOrNorthernIreland = isUK &&
  (data.address.adminDistrict === 'Northern Ireland' || data.address.adminDistrict === 'Scotland')

  const isEngland = await getIsEngland(center[0], center[1])

  const distanceInMetres = {
    '2k': 2000,
    '10k': 10000
  }

  // add buffer to place.bbox for stations search
  const bbox2k = addBufferToBbox(bbox, distanceInMetres['2k'])
  const bbox10k = addBufferToBbox(bbox, distanceInMetres['10k'])

  return [{
    name,
    center,
    bbox2k,
    bbox10k,
    isUK,
    isScotlandOrNorthernIreland,
    isEngland
  }]
}

module.exports = bingResultsParser
