'use strict'

const path = require('path')
const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const nunjucks = require('nunjucks')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

describe('Plugin - Cookies', () => {
  let server

  const setupServer = async (routes = []) => {
    server = Hapi.server({ port: 3019, host: 'localhost' })

    await server.register(require('@hapi/vision'))
    await server.register(require('../../server/plugins/cookies'))

    server.views({
      engines: {
        html: {
          compile: (src, options) => {
            const template = nunjucks.compile(src, options.environment)
            return context => template.render(context)
          },
          prepare: (options, next) => {
            options.compileOptions.environment = nunjucks.configure(options.path)
            return next()
          }
        }
      },
      path: path.join(__dirname, '../data/views'),
      isCached: false
    })

    // Cookies are parsed as plain strings so tests control the exact value seen by the plugin
    server.state('cookie_policy', { encoding: 'none', clearInvalid: true, strictHeader: false, isSecure: false })
    server.state('set_cookie_usage', { encoding: 'none', clearInvalid: true, strictHeader: false, isSecure: false })

    server.route([
      {
        method: 'GET',
        path: '/context',
        handler: request => request.plugins['cookie-requirements']
      },
      ...routes
    ])

    await server.initialize()
  }

  const getContext = async (options = {}) => {
    const response = await server.inject({ method: 'GET', url: options.url || '/context', headers: options.headers })
    return JSON.parse(response.payload)
  }

  afterEach(async () => {
    await server.stop()
  })

  describe('onPostAuth - cookie policy resolution', () => {
    beforeEach(async () => {
      await setupServer()
    })

    it('defaults to analytics off when no cookies are present', async () => {
      const context = await getContext()

      expect(context.cookiePolicySettings).to.equal({ analytics: false })
      expect(context.hasCookiePolicy).to.be.false()
    })

    it('falls back to the legacy set_cookie_usage cookie when there is no policy', async () => {
      const context = await getContext({ headers: { cookie: 'set_cookie_usage=true' } })

      expect(context.cookiePolicySettings).to.equal({ analytics: true })
      expect(context.hasCookiePolicy).to.be.false()
    })

    it('treats any set_cookie_usage value other than "true" as analytics off', async () => {
      const context = await getContext({ headers: { cookie: 'set_cookie_usage=false' } })

      expect(context.cookiePolicySettings).to.equal({ analytics: false })
    })

    it('flags that a policy exists when cookie_policy is set', async () => {
      const context = await getContext({ headers: { cookie: 'cookie_policy=anything' } })

      expect(context.hasCookiePolicy).to.be.true()
    })

    it('ignores a non object cookie_policy and falls back to set_cookie_usage', async () => {
      const context = await getContext({ headers: { cookie: 'cookie_policy=notanobject; set_cookie_usage=true' } })

      expect(context.cookiePolicySettings).to.equal({ analytics: true })
      expect(context.hasCookiePolicy).to.be.true()
    })
  })

  describe('onPostAuth - cookie policy object', () => {
    beforeEach(async () => {
      server = Hapi.server({ port: 3019, host: 'localhost' })
      await server.register(require('../../server/plugins/cookies'))

      server.state('cookie_policy', { encoding: 'base64json', clearInvalid: true, strictHeader: false, isSecure: false })

      server.route({
        method: 'GET',
        path: '/context',
        handler: request => request.plugins['cookie-requirements']
      })

      await server.initialize()
    })

    const encodePolicy = policy => Buffer.from(JSON.stringify(policy)).toString('base64')

    it('reads analytics consent from a cookie_policy object', async () => {
      const context = await getContext({ headers: { cookie: `cookie_policy=${encodePolicy({ analytics: true })}` } })

      expect(context.cookiePolicySettings).to.equal({ analytics: true })
      expect(context.hasCookiePolicy).to.be.true()
    })

    it('reads a withdrawn consent from a cookie_policy object', async () => {
      const context = await getContext({ headers: { cookie: `cookie_policy=${encodePolicy({ analytics: false })}` } })

      expect(context.cookiePolicySettings).to.equal({ analytics: false })
      expect(context.hasCookiePolicy).to.be.true()
    })
  })

  describe('onPostAuth - current url', () => {
    beforeEach(async () => {
      await setupServer()
    })

    it('reports the current path when there is no query string', async () => {
      const context = await getContext()

      expect(context.currentUrl).to.equal('/context')
      expect(context.cookieChoiceMade).to.be.null()
    })

    it('strips cookie_choice_made so the return url does not repeat the confirmation', async () => {
      const context = await getContext({ url: '/context?cookie_choice_made=accept' })

      expect(context.currentUrl).to.equal('/context')
      expect(context.cookieChoiceMade).to.equal('accept')
    })

    it('preserves other query parameters when stripping cookie_choice_made', async () => {
      const context = await getContext({ url: '/context?q=york&cookie_choice_made=reject' })

      expect(context.currentUrl).to.equal('/context?q=york')
      expect(context.cookieChoiceMade).to.equal('reject')
    })
  })

  describe('onPreResponse', () => {
    it('merges cookie data into a view context without losing route data', async () => {
      await setupServer([{
        method: 'GET',
        path: '/view',
        handler: (request, h) => h.view('cookie-context', { existing: 'kept' })
      }])

      const response = await server.inject({ method: 'GET', url: '/view?cookie_choice_made=accept', headers: { cookie: 'set_cookie_usage=true' } })

      expect(response.statusCode).to.equal(200)
      expect(response.payload.trim()).to.equal('/view|accept|true|false|kept')
    })

    it('adds a context to a view rendered without one', async () => {
      await setupServer([{
        method: 'GET',
        path: '/view',
        handler: (request, h) => h.view('cookie-context')
      }])

      const response = await server.inject({ method: 'GET', url: '/view' })

      expect(response.statusCode).to.equal(200)
      expect(response.payload.trim()).to.equal('/view||false|false|')
    })

    it('leaves non view responses untouched', async () => {
      await setupServer([{
        method: 'GET',
        path: '/json',
        handler: () => ({ hello: 'world' })
      }])

      const response = await server.inject({ method: 'GET', url: '/json' })

      expect(response.statusCode).to.equal(200)
      expect(JSON.parse(response.payload)).to.equal({ hello: 'world' })
    })

    it('leaves error responses untouched', async () => {
      await setupServer([{
        method: 'GET',
        path: '/boom',
        handler: () => {
          throw new Error('nope')
        }
      }])

      const response = await server.inject({ method: 'GET', url: '/boom' })

      expect(response.statusCode).to.equal(500)
    })
  })
})
