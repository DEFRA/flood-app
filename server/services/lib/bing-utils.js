const turf = require('@turf/turf')

function removeRepeatingEntries (inputString) {
  const itemsArray = inputString.split(',').map(item => item.trim())
  const uniqueItemsArray = [...new Set(itemsArray)]
  return uniqueItemsArray.join(', ')
}

function hasCityQualifier (itemsArray) {
  const regex = new RegExp(`^(Greater|City Of) ${itemsArray[0]}$`, 'i')
  return regex.test(itemsArray[1])
}

function removeCityQualifiers (inputString) {
  // remove qualifiers such as Greater London and City Of Portsmouth from the final entry in a place name
  // e.g. Camberwell, London, Greater London => Camberwell, London
  // e.g. London, Greater London => London
  const splitToken = ', '
  const itemsArray = inputString.split(splitToken)
  const length = itemsArray.length
  const penultimate = -2
  if (length >= 2 && hasCityQualifier(itemsArray.slice(penultimate))) {
    return itemsArray.slice(0, -1).join(splitToken)
  }
  return inputString
}

function formatName (name) {
  if (!name) {
    return ''
  }
  return removeCityQualifiers(removeRepeatingEntries(name))
}

function slugify (text = '') {
  return text.replace(/,/g, '').replace(/ /g, '-').toLowerCase()
}

function addBufferToBbox (bbox, m) {
  // Convert bbox (binding box) )into polygon, add buffer, and convert back to bbox as db query needs a bbox envelope
  return turf.bbox(turf.buffer(turf.bboxPolygon(bbox), m, { units: 'meters' }))
}

module.exports = {
  formatName,
  slugify,
  addBufferToBbox
}
