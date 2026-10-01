const { normalisePolicy } = require('../routes/lib/cookie-utils')

module.exports = {
  plugin: {
    name: 'cookie-requirements',
    register: (server) => {
      server.ext('onPostAuth', (request, h) => {
        const rawCookiePolicy = request?.state?.cookie_policy
        const usageCookie = request?.state?.set_cookie_usage

        const cookiePolicySettings = normalisePolicy(rawCookiePolicy, usageCookie)

        const currentUrlObj = new URL(request.url.href, `${request.server.info.uri}`)
        currentUrlObj.searchParams.delete('cookie_choice_made')

        request.plugins['cookie-requirements'] = {
          currentUrl: currentUrlObj.pathname + currentUrlObj.search,
          cookieChoiceMade: request.query.cookie_choice_made || null,
          cookiePolicySettings,
          hasCookiePolicy: !!rawCookiePolicy
        }

        return h.continue
      })

      server.ext('onPreResponse', (request, h) => {
        const response = request.response
        const cookieData = request.plugins['cookie-requirements']

        if (response?.variety === 'view' && response?.source && cookieData) {
          response.source.context = response.source.context || {}

          Object.assign(response.source.context, cookieData)
        }

        return h.continue
      })
    }
  }
}
