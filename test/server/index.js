'use strict'

const Lab = require('@hapi/lab')
const { describe, it, beforeEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')

describe('Server initialization functions - [server/lib/server-helpers.js]', () => {
  const { registerCookieStates, registerLifecycleHooks } = require('../../server/lib/server-helpers')
  const { THIRTY_DAYS_MS, FOUR_HUNDRED_DAYS_MS } = require('../../server/constants')
  let mockServer

  beforeEach(() => {
    mockServer = {
      state: sinon.spy(),
      ext: sinon.spy()
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

      expect(mockServer.state.callCount).to.equal(7)
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

      const setCookieUsageCall = mockServer.state.getCalls().find(call => call.args[0] === 'set_cookie_usage')
      expect(setCookieUsageCall).to.exist()
      expect(setCookieUsageCall.args[1].ttl).to.equal(THIRTY_DAYS_MS)
      expect(setCookieUsageCall.args[1].encoding).to.equal('none')
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

      const cookiePolicyCall = mockServer.state.getCalls().find(call => call.args[0] === 'cookie_policy')
      expect(cookiePolicyCall).to.exist()
      expect(cookiePolicyCall.args[1].encoding).to.equal('base64json')
      expect(cookiePolicyCall.args[1].ttl).to.equal(THIRTY_DAYS_MS)
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

      const seenMessageCall = mockServer.state.getCalls().find(call => call.args[0] === 'seen_cookie_message')
      expect(seenMessageCall).to.exist()
      expect(seenMessageCall.args[1].ttl).to.equal(FOUR_HUNDRED_DAYS_MS)
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

      const optOutCall = mockServer.state.getCalls().find(call => call.args[0] === 'google-analytics-opt-out')
      expect(optOutCall).to.exist()
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

      const stateNames = mockServer.state.getCalls().map(call => call.args[0])
      expect(stateNames).to.include('_ga')
      expect(stateNames).to.include('_gid')
      expect(stateNames).to.include('_gat')
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
      const setCookieUsageCall = mockServer.state.getCalls().find(call => call.args[0] === 'set_cookie_usage')
      expect(setCookieUsageCall.args[1].isSecure).to.equal(true)
    })
  })

  describe('registerLifecycleHooks', () => {
    it('registers onPreResponse lifecycle hook', () => {
      registerLifecycleHooks(mockServer)

      expect(mockServer.ext.calledWith('onPreResponse')).to.be.true()
    })

    it('registers hook with a function handler', () => {
      registerLifecycleHooks(mockServer)

      const extCall = mockServer.ext.getCall(0)
      expect(extCall.args[1]).to.be.a.function()
    })

    it('hook does not clear cookies when analytics consent is not set', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.getCall(0).args[1]
      const request = {
        state: {},
        response: { isBoom: false, unstate: sinon.spy() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate.called).to.be.false()
    })

    it('hook does not clear cookies when analytics consent is true', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.getCall(0).args[1]
      const request = {
        state: { cookie_policy: { analytics: true }, _ga: 'value' },
        response: { isBoom: false, unstate: sinon.spy() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate.called).to.be.false()
    })

    it('hook clears cookies when analytics consent is false and cookies exist', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.getCall(0).args[1]
      const request = {
        state: { cookie_policy: { analytics: false }, _ga: 'value', _gid: 'value2' },
        response: { isBoom: false, unstate: sinon.spy() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate.called).to.be.true()
    })

    it('hook does not clear cookies if response is an error', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.getCall(0).args[1]
      const request = {
        state: { cookie_policy: { analytics: false }, _ga: 'value' },
        response: { isBoom: true, unstate: sinon.spy() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate.called).to.be.false()
    })

    it('hook handles null request.state gracefully', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.getCall(0).args[1]
      const request = {
        state: null,
        response: { isBoom: false, unstate: sinon.spy() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      expect(() => handler(request, h)).to.not.throw()
      expect(request.response.unstate.called).to.be.false()
    })

    it('hook returns h.continue', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.getCall(0).args[1]
      const request = {
        state: {},
        response: { isBoom: false, unstate: sinon.spy() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      const result = handler(request, h)

      expect(result).to.equal(h.continue)
    })

    it('hook does not clear cookies if no analytics cookies exist in request state', () => {
      registerLifecycleHooks(mockServer)

      const handler = mockServer.ext.getCall(0).args[1]
      const request = {
        state: { cookie_policy: { analytics: false }, other_cookie: 'value' },
        response: { isBoom: false, unstate: sinon.spy() },
        info: { hostname: 'example.com' }
      }
      const h = { continue: 'continue' }

      handler(request, h)

      expect(request.response.unstate.called).to.be.false()
    })
  })
})
