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

  // Browsers normalise backslashes to forward slashes, so "/\evil.example.com" is an off site redirect
  if (returnUrl.includes('\\')) {
    return '/'
  }

  return returnUrl
}

// This returns each registrable parent domain prefixed with a dot for domain attribute use. The dot prefix is not required for modern browsers
// but is there to ensure legacy compliance. Cookies may have been set on any of these levels, so all of them need clearing
const getCookieDomainCandidates = (hostname) => {
  if (!hostname || typeof hostname !== 'string') {
    return []
  }

  const parts = hostname.split('.')

  // Single label hosts (eg localhost) and IP addresses cannot carry a domain attribute
  if (parts.length < 2 || /^[\d.]+$/.test(hostname)) {
    return []
  }

  return parts
    .map((_, index) => `.${parts.slice(index).join('.')}`)
    .slice(0, parts.length - 1)
}

// Clear all _ga cookies (host-only and parent domain variants) from a response.
// Called when analytics consent is rejected.
const clearAnalyticsCookies = (response, requestState, hostname) => {
  const analyticsCookieNames = Object.keys(requestState)
    .filter(key => /^_ga($|_.*)|^_gid$|^_gat($|_.*)/.test(key))

  // Clear host-only cookies (no domain attribute)
  analyticsCookieNames.forEach(cookieName => {
    response.unstate(cookieName)
  })

  // Clear cookies on all parent domain levels
  const parentDomains = getCookieDomainCandidates(hostname)

  parentDomains.forEach(domain => {
    analyticsCookieNames.forEach(cookieName => {
      response.unstate(cookieName, { domain, path: '/' })
    })
  })
}

module.exports = { normalisePolicy, sanitiseReturnUrl, getCookieDomainCandidates, clearAnalyticsCookies }
