const { siteUrl } = require('../config')
const { normalisePolicy, sanitiseReturnUrl, clearAnalyticsCookies } = require('./lib/cookie-utils')
const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

module.exports = [{
  method: 'GET',
  path: '/cookies',
  handler: async (request, h) => {
    const cookiePolicySettings = normalisePolicy(request.state.cookie_policy, request.state.set_cookie_usage)
    let requestHeadersReferer = request.headers?.referer?.startsWith(siteUrl) ? encodeURI(request.headers.referer) : ''

    if (requestHeadersReferer) {
      const urlStringArr = requestHeadersReferer.split(siteUrl)
      if (urlStringArr[1] && !urlStringArr[1].startsWith('/') && !siteUrl.endsWith('/')) {
        requestHeadersReferer = ''
      }
    }

    return h.view('cookies', {
      pageTitle: 'Cookies - Check for flooding',
      metaDescription: description,
      referer: requestHeadersReferer,
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
    const redirectUrl = `${safeReturnUrl}${safeReturnUrl.includes('?') ? '&' : '?'}cookie_choice_made=${selectedChoice}`
    const requestedWith = request.headers['x-requested-with']
    const wantsJson = (request.headers.accept || '').includes('application/json')
    const isAjaxRequest = requestedWith === 'XMLHttpRequest' || wantsJson

    const response = h.response(isAjaxRequest
      ? {
          choice: selectedChoice,
          redirectUrl
        }
      : null)

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
