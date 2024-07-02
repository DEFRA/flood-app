const qs = require('qs')
const boom = require('@hapi/boom')

function slugify (text = '') {
  return text.replace(/,/g, '').replace(/ /g, '-').toLowerCase()
}

function isLocationEngland (location) {
  return location.match(/^england$/i)
}

function isPlaceEngland (place) {
  return place?.isEngland.is_england
}

function isValidLocationSlug (location, place) {
  return slugify(place?.name) !== location
}

function createQueryParametersString (queryObject) {
  const { q, location, ...otherParameters } = queryObject
  const queryString = qs.stringify(otherParameters, { addQueryPrefix: true, encode: false })
  return queryString
}

function renderLocationNotFound (href, location, h) {
  return h.view('location-not-found', { pageTitle: 'Error: Find location - Check for flooding', href, location }).takeover()
}

function renderNotFound (location) {
  return boom.notFound(`Location ${location} not found`)
}

function failActionHandler (request, h, page) {
  request.logger.warn({
    situation: 'Location search error: Invalid or no string input.'
  })

  const location = request.query.q || request.payload?.location

  if (!location) {
    return h.redirect(page).takeover()
  } else {
    return renderLocationNotFound(page, location, h)
  }
}

module.exports = {
  slugify,
  failActionHandler,
  isLocationEngland,
  isPlaceEngland,
  isValidLocationSlug,
  renderNotFound,
  renderLocationNotFound,
  createQueryParametersString
}
