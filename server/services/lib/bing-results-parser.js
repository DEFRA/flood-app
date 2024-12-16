const { addBufferToBbox, formatName } = require('../../util')

async function bingResultsParser (bingData, getIsEngland) {
  const set = bingData.resourceSets[0]
  if (set.estimatedTotal === 0) {
    return []
  }

  const allowedConfidences = ['medium', 'high']

  // adding comment to force build
  const allowedTypes = [
    'populatedplace', 'postcode1', 'postcode3', 'admindivision2', 'neighborhood', 'religiousstructure', 'roadblock'
  ]
  const data = set.resources
    .filter(r => allowedConfidences.includes(r.confidence.toLowerCase()))
    .filter(r => allowedTypes.includes(r.entityType.toLowerCase()))[0]

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
