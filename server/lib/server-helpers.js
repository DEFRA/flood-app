const config = require('../config')
const { THIRTY_DAYS_MS, FOUR_HUNDRED_DAYS_MS } = require('../constants')

async function registerPlugins (server) {
  await server.register(require('@hapi/inert'))
  await server.register(require('@hapi/h2o2'))
  await server.register(require('../plugins/views'))
  await server.register(require('../plugins/router'))
  await server.register(require('../plugins/error-pages'))
  await server.register(require('../plugins/cookies'))
  await server.register(require('../plugins/on-post-handler'))
  await server.register(require('../plugins/session'))
  await server.register(require('../plugins/logging'))
  if (config.rateLimitEnabled) {
    await server.register(require('../plugins/rate-limit'))
  }
}

function registerCookieStates (server, consentCookieOptions) {
  server.state('set_cookie_usage', {
    ...consentCookieOptions,
    ttl: THIRTY_DAYS_MS,
    encoding: 'none'
  })

  server.state('cookie_policy', {
    ...consentCookieOptions,
    ttl: THIRTY_DAYS_MS,
    encoding: 'base64json'
  })

  server.state('seen_cookie_message', {
    ...consentCookieOptions,
    ttl: FOUR_HUNDRED_DAYS_MS,
    encoding: 'none'
  })

  server.state('google-analytics-opt-out', {
    ...consentCookieOptions,
    ttl: THIRTY_DAYS_MS,
    encoding: 'none'
  })

  // Registered so they can be read and cleared server side when consent is withdrawn
  server.state('_ga', { path: '/', encoding: 'none' })
  server.state('_gid', { path: '/', encoding: 'none' })
  server.state('_gat', { path: '/', encoding: 'none' })
}

function registerLifecycleHooks (server) {
  // Lifecycle hook: automatically clear _ga cookies whenever analytics consent is rejected
  server.ext('onPreResponse', (request, h) => {
    const cookiePolicy = request.state?.cookie_policy
    const analyticsRejected = cookiePolicy?.analytics === false

    if (analyticsRejected) {
      const response = request.response

      // Only unstate if this is an actual response (not an error)
      if (response.isBoom !== true) {
        // Check if there are any analytics cookies to remove
        const analyticsCookiesExist = Object.keys(request.state)
          .some(key => /^_ga($|_.*)|^_gid$|^_gat($|_.*)/.test(key))

        if (analyticsCookiesExist) {
          const { clearAnalyticsCookies } = require('../routes/lib/cookie-utils')
          clearAnalyticsCookies(response, request.state, request?.info?.hostname)
        }
      }
    }

    return h.continue
  })
}

module.exports = { registerPlugins, registerCookieStates, registerLifecycleHooks }
