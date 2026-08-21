/**
 * Builds a JSON error response for a failed backend/proxy call.
 * If the upstream service returned a structured 4xx (client error, e.g. an
 * invalid bbox), propagate that status code and message so the caller can
 * distinguish "you sent something invalid" from "the backend is down".
 * Anything else (network errors, 5xx, unrecognised shapes) is treated as a
 * generic 500 with a fixed, non-leaky message.
 */
function handleProxyError (h, err, fallbackMessage) {
  const isClientError = typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500
  const statusCode = isClientError ? err.statusCode : 500
  const message = isClientError ? (err.message || fallbackMessage) : fallbackMessage

  return h.response({ error: message }).code(statusCode)
}

module.exports = { handleProxyError }
