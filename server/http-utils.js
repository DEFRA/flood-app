const config = require('./config')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.httpTimeoutMs
})
const LocationSearchError = require('./location-search-error')

async function request (method, url, options) {
  let res, payload
  let urlObj

  // Validate URL early to prevent issues with malformed URLs
  try {
    urlObj = new URL(url)
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`)
  }

  const HTTP_STATUS_CODE_OK = 200

  try {
    const response = await wreck[method](url, options)
    res = response.res
    payload = response.payload
  } catch (error) {
    // Add request details to network-related errors for better debugging
    if (error?.message?.startsWith('Response Error:')) {
      // Use URL object to safely extract origin and path without query parameters
      error.message += ` on ${method.toUpperCase()} ${urlObj.origin}${urlObj.pathname}`
    }
    throw error
  }
  // Special case: Check for empty location search response header
  if (res.headers['x-ms-bm-ws-info'] === '1') {
    throw new LocationSearchError('Empty location search response indicated by header check of x-ms-bm-ws-info')
  }

  // Handle non-200 status codes by throwing either the payload or a generic error
  if (res.statusCode !== HTTP_STATUS_CODE_OK) {
    // If payload is falsy (null, undefined, empty string, etc.), throw a generic error
    // Otherwise throw the payload itself which typically contains error details
    throw (payload || new Error('Unknown error'))
  }
  return payload
}

/**
 * Convenience wrapper for HTTP GET requests
 */
function get (url, options) {
  return request('get', url, options)
}

/**
 * Convenience wrapper for HTTP POST requests
 */
function post (url, options) {
  return request('post', url, options)
}

/**
 * Convenience wrapper for HTTP POST requests with JSON payload
 */
function postJson (url, options) {
  options = options || {}
  options.json = true
  return post(url, options)
}

/**
 * Convenience wrapper for HTTP GET requests expecting JSON response
 */
function getJson (url) {
  return get(url, { json: true })
}

module.exports = {
  get,
  post,
  getJson,
  postJson,
  request
}
