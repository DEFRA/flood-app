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

// This returns the parent domain prefixed with dot for domain attribute use. The dot prefix is not required for modern browsers but is there
// to ensure legacy compliance
const getCookieDomainCandidates = (hostname) => {
  if (!hostname || typeof hostname !== 'string') {
    return []
  } else {
    return [`.${hostname}`]
  }
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
