const { normalisePolicy, sanitiseReturnUrl, clearAnalyticsCookies } = require('./lib/cookie-utils')
const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

// Only same site pages are offered as a "go back" link, and never this page itself.
// Compared by host only (not scheme) because a TLS-terminating proxy means the app may see
// http internally even though the browser's referer is https
const resolveReferer = (candidate, requestHost) => {
  if (!candidate || typeof candidate !== 'string' || !requestHost) {
    return ''
  }

  let url

  try {
    url = new URL(candidate, `http://${requestHost}`)
  } catch {
    return ''
  }

  const isCookiesPage = url.pathname === '/cookies' || url.pathname.startsWith('/cookies/')

  if (url.host !== requestHost || isCookiesPage) {
    return ''
  }

  return encodeURI(candidate)
}

module.exports = [{
  method: 'GET',
  path: '/cookies',
  handler: async (request, h) => {
    const cookiePolicySettings = normalisePolicy(request.state.cookie_policy, request.state.set_cookie_usage)
    // Saving a preference reloads this page, so the header referer becomes /cookies itself.
    // The query referer is the original page, carried through the form post
    const referer = resolveReferer(request.query?.referer, request.info.host) || resolveReferer(request.headers?.referer, request.info.host)

    return h.view('cookies', {
      pageTitle: 'Cookies - Check for flooding',
      metaDescription: description,
      referer,
      analyticsCookiesSet: cookiePolicySettings.analytics,
      cookiePolicySettings
    })
  }
},
{
  method: 'POST',
  path: '/cookie-preferences',
  /**
   * This route handles both a form post and a client-side fetch when JS is available
   * It sets the user's cookie preferences.
   * @param {object} request Hapi request object
   * @param {object} h Hapi response toolkit
   * @returns
   */
  handler: (request, h) => {
    const { 'analytics-consent': choice, returnUrl } = request.payload || {}
    const selectedChoice = choice === 'accept' ? 'accept' : 'reject'
    const safeReturnUrl = sanitiseReturnUrl(returnUrl)
    // Any fragment has to stay at the end
    const [pathAndQuery, ...fragmentParts] = safeReturnUrl.split('#')
    const fragment = fragmentParts.length ? `#${fragmentParts.join('#')}` : ''
    const redirectUrl = `${pathAndQuery}${pathAndQuery.includes('?') ? '&' : '?'}cookie_choice_made=${selectedChoice}${fragment}`
    const requestedWith = request.headers['x-requested-with']
    const wantsJson = (request.headers.accept || '').includes('application/json')
    const isAjaxRequest = requestedWith === 'XMLHttpRequest' || wantsJson

    const payloadBody = isAjaxRequest ? { choice: selectedChoice, redirectUrl } : null
    const response = h.response(payloadBody)

    const cookieSettings = { analytics: selectedChoice === 'accept' }
    response.state('cookie_policy', cookieSettings)
    response.state('seen_cookie_message', 'true')

    if (selectedChoice === 'reject') {
      response.unstate('set_cookie_usage')
      clearAnalyticsCookies(response, request.state, request?.info?.hostname)
      response.state('google-analytics-opt-out', 'true')
    } else {
      response.state('set_cookie_usage', 'true')
      response.unstate('google-analytics-opt-out')
    }

    if (isAjaxRequest) {
      return response
    }

    return response.redirect(redirectUrl)
  }
}]
