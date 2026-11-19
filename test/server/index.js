'use strict'

describe('Server initialization functions - [server/lib/server-helpers.js]', () => {
  const { registerCookieStates, registerLifecycleHooks } = require('../../server/lib/server-helpers')
  const { THIRTY_DAYS_MS, FOUR_HUNDRED_DAYS_MS } = require('../../server/constants')
  let mockServer

  beforeEach(() => {
    mockServer = {
      state: jest.fn(),
      ext: jest.fn()
    }
  })

  describe('registerCookieStates', () => {
    it('registers all consent and analytics cookie states', () => {
      const consentCookieOptions = {
        isSecure: true,
        isHttpOnly: false,
        path: '/',
        isSameSite: 'Lax',
        clearInvalid: true,
        strictHeader: false
      }

      registerCookieStates(mockServer, consentCookieOptions)

      expect(mockServer.state.mock.calls.length).toBe(7)
    })

    it('registers set_cookie_usage with correct options', () => {
      const consentCookieOptions = {
        isSecure: true,
        isHttpOnly: false,
        path: '/',
        isSameSite: 'Lax',
        clearInvalid: true,
        strictHeader: false
      }

      registerCookieStates(mockServer, consentCookieOptions)

      const setCookieUsageCall = mockServer.state.mock.calls.find(args => args[0] === 'set_cookie_usage')
      expect(setCookieUsageCall).not.toBeNil()
      expect(setCookieUsageCall[1].ttl).toEqual(THIRTY_DAYS_MS)
      expect(setCookieUsageCall[1].encoding).toBe('none')
    })

    it('registers cookie_policy with base64json encoding', () => {
      const consentCookieOptions = {
        isSecure: true,
        isHttpOnly: false,
        path: '/',
        isSameSite: 'Lax',
        clearInvalid: true,
        strictHeader: false
      }

      registerCookieStates(mockServer, consentCookieOptions)

      const cookiePolicyCall = mockServer.state.mock.calls.find(args => args[0] === 'cookie_policy')
      expect(cookiePolicyCall).not.toBeNil()
      expect(cookiePolicyCall[1].encoding).toBe('base64json')
      expect(cookiePolicyCall[1].ttl).toEqual(THIRTY_DAYS_MS)
    })

    it('registers seen_cookie_message with FOUR_HUNDRED_DAYS_MS TTL', () => {
      const consentCookieOptions = {
        isSecure: true,
        isHttpOnly: false,
        path: '/',
        isSameSite: 'Lax',
        clearInvalid: true,
        strictHeader: false
      }

      registerCookieStates(mockServer, consentCookieOptions)

      const seenMessageCall = mockServer.state.mock.calls.find(args => args[0] === 'seen_cookie_message')
      expect(seenMessageCall).not.toBeNil()
      expect(seenMessageCall[1].ttl).toEqual(FOUR_HUNDRED_DAYS_MS)
    })

    it('registers google-analytics-opt-out cookie', () => {
      const consentCookieOptions = {
        isSecure: true,
        isHttpOnly: false,
        path: '/',
        isSameSite: 'Lax',
        clearInvalid: true,
        strictHeader: false
      }

      registerCookieStates(mockServer, consentCookieOptions)

      const optOutCall = mockServer.state.mock.calls.find(args => args[0] === 'google-analytics-opt-out')
      expect(optOutCall).not.toBeNil()
    })

    it('registers _ga, _gid, and _gat analytics cookies', () => {
      const consentCookieOptions = {
        isSecure: true,
        isHttpOnly: false,
        path: '/',
        isSameSite: 'Lax',
        clearInvalid: true,
        strictHeader: false
      }

      registerCookieStates(mockServer, consentCookieOptions)

      const stateNames = mockServer.state.mock.calls.map(args => args[0])
      expect(stateNames).toContain('_ga')
      expect(stateNames).toContain('_gid')
      expect(stateNames).toContain('_gat')
    })

    it('passes secure flag from consentCookieOptions to all states', () => {
      const consentCookieOptions = {
        isSecure: true,
        isHttpOnly: false,
        path: '/',
        isSameSite: 'Lax',
        clearInvalid: true,
        strictHeader: false
      }

      registerCookieStates(mockServer, consentCookieOptions)

      // Check that isSecure is passed to consent-related cookies
      const setCookieUsageCall = mockServer.state.mock.calls.find(args => args[0] === 'set_cookie_usage')
      expect(setCookieUsageCall[1].isSecure).toEqual(true)
    })
  })

  describe('registerLifecycleHooks', () => {
    it('registers onPreResponse lifecycle hook', () => {
      registerLifecycleHooks(mockServer)

      expect(mockServer.ext).toHaveBeenCalledWith('onPreResponse', expect.anything())
    })

    it('registers hook with a function handler', () => {
      registerLifecycleHooks(mockServer)

      const extCall = mockServer.ext.mock.calls[0]
      expect(extCall[1]).toBeFunction()
    })

    it('hook does not clear cookies when analytics consent is not set', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.mock.calls[0][1]
      const request = {
        state: {},
        response: { isBoom: false, unstate: jest.fn() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate).not.toHaveBeenCalled()
    })

    it('hook does not clear cookies when analytics consent is true', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.mock.calls[0][1]
      const request = {
        state: { cookie_policy: { analytics: true }, _ga: 'value' },
        response: { isBoom: false, unstate: jest.fn() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate).not.toHaveBeenCalled()
    })

    it('hook clears cookies when analytics consent is false and cookies exist', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.mock.calls[0][1]
      const request = {
        state: { cookie_policy: { analytics: false }, _ga: 'value', _gid: 'value2' },
        response: { isBoom: false, unstate: jest.fn(), header: jest.fn() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate).toHaveBeenCalled()
      // One appended header per analytics cookie and parent domain combination
      expect(request.response.header).toHaveBeenCalledTimes(2)
      expect(request.response.header.mock.calls[0][1]).toContain('Domain=.example.com')
      expect(request.response.header.mock.calls[0][2]).toEqual({ append: true })
    })

    it('hook does not clear cookies if response is an error', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.mock.calls[0][1]
      const request = {
        state: { cookie_policy: { analytics: false }, _ga: 'value' },
        response: { isBoom: true, unstate: jest.fn() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate).not.toHaveBeenCalled()
    })

    it('hook handles null request.state gracefully', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.mock.calls[0][1]
      const request = {
        state: null,
        response: { isBoom: false, unstate: jest.fn() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      expect(() => handler(request, h)).not.toThrow()
      expect(request.response.unstate).not.toHaveBeenCalled()
    })

    it('hook returns h.continue', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.mock.calls[0][1]
      const request = {
        state: {},
        response: { isBoom: false, unstate: jest.fn() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      const result = handler(request, h)

      expect(result).toEqual(h.continue)
    })

    it('hook does not clear cookies if no analytics cookies exist in request state', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.mock.calls[0][1]
      const request = {
        state: { cookie_policy: { analytics: false }, other_cookie: 'value' },
        response: { isBoom: false, unstate: jest.fn() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate).not.toHaveBeenCalled()
    })
  })

  describe('registerPlugins', () => {
    const { registerPlugins } = require('../../server/lib/server-helpers')
    const config = require('../../server/config')

    it('registers the core plugins without rate limiting', async () => {
      jest.replaceProperty(config, 'rateLimitEnabled', false)
      mockServer.register = jest.fn().mockResolvedValue(undefined)

      await registerPlugins(mockServer)

      expect(mockServer.register).toHaveBeenCalledTimes(9)
      expect(mockServer.register.mock.calls.map(([p]) => p.plugin?.pkg?.name)).not.toContain('hapi-rate-limit')
    })

    it('registers the rate limit plugin when enabled', async () => {
      jest.replaceProperty(config, 'rateLimitEnabled', true)
      mockServer.register = jest.fn().mockResolvedValue(undefined)

      await registerPlugins(mockServer)

      expect(mockServer.register).toHaveBeenCalledTimes(10)
      expect(mockServer.register.mock.calls[9][0].plugin.pkg.name).toBe('hapi-rate-limit')
    })
  })
})
