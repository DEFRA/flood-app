/**
 * Builds a JSON error response for a failed backend/proxy call.
 * If the upstream service returned a structured 4xx (client error, e.g. an
 * invalid bbox), propagate that status code and message so the caller can
 * distinguish "you sent something invalid" from "the backend is down".
 * Anything else (network errors, 5xx, unrecognised shapes) is treated as a
 * generic 500 with a fixed, non-leaky message.
 */
const { HTTP_BAD_REQUEST, INTERNAL_SERVER_ERROR } = require('../../../constants')

function handleProxyError (h, err, fallbackMessage) {
  const isClientError = typeof err?.statusCode === 'number' && err.statusCode >= HTTP_BAD_REQUEST && err.statusCode < INTERNAL_SERVER_ERROR
  const statusCode = isClientError ? err.statusCode : INTERNAL_SERVER_ERROR
  const message = isClientError ? (err.message || fallbackMessage) : fallbackMessage

  return h.response({ error: message }).code(statusCode)
}

module.exports = { handleProxyError }
