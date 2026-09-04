const normalisePolicy = (rawPolicy, fallbackUsageCookie) => {
  if (rawPolicy && typeof rawPolicy === 'object') {
    return { analytics: !!rawPolicy.analytics }
  }

  if (typeof rawPolicy === 'string') {
    try {
      const parsed = JSON.parse(rawPolicy)
      if (parsed && typeof parsed === 'object') {
        return { analytics: !!parsed.analytics }
      }
    } catch (_) { // NOSONAR
    }
  }

  return { analytics: fallbackUsageCookie === 'true' }
}

const sanitiseReturnUrl = (returnUrl) => {
  if (!returnUrl || typeof returnUrl !== 'string') {
    return '/'
  }

  // Protocol relative urls would allow an open redirect off site
  if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return '/'
  }

  return returnUrl
}

// Google Analytics' cookie_domain "auto" setting can store _ga cookies on a parent
// domain (e.g. .service.gov.uk), so clearing must target parent domains when needed.
// This returns all possible parent domains (prefixed with dot for domain attribute use).
const getCookieDomainCandidates = (hostname) => {
  if (!hostname || typeof hostname !== 'string') {
    return []
  }

  const domains = []
  const parts = hostname.split('.')

  for (let i = 1; i < parts.length - 1; i++) {
    domains.push(`.${parts.slice(i).join('.')}`)
  }

  return domains
}

module.exports = { normalisePolicy, sanitiseReturnUrl, getCookieDomainCandidates }
