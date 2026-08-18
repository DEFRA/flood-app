const cookieConsentDays = 30
const gaCookieAgeDays = 400
const THIRTY_DAYS_MS = cookieConsentDays * 24 * 60 * 60 * 1000
const FOUR_HUNDRED_DAYS_MS = gaCookieAgeDays * 24 * 60 * 60 * 1000

module.exports = {
  HTTP_MOVED_PERMANENTLY: 301,
  HTTP_BAD_REQUEST: 400,
  HTTP_NOT_FOUND: 404,
  HTTP_TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  THIRTY_DAYS_MS,
  FOUR_HUNDRED_DAYS_MS
}
