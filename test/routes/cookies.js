'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { siteUrl } = require('../../server/config')

describe('Route - Cookies', () => {
  let sandbox
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/plugins/on-post-handler.js')]

    sandbox = await sinon.createSandbox()

    server = Hapi.server({
      port: 3009,
      host: 'localhost'
    })
  })

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  const cookiesPlugin = {
    plugin: { name: 'cookies', register: (s) => { s.route(require('../../server/routes/cookies')) } }
  }

  const registerCookieStates = (s, { cookiePolicyEncoding = 'base64json' } = {}) => {
    const base = { clearInvalid: true, strictHeader: false, isSecure: false, isHttpOnly: false }
    s.state('cookie_policy', { ...base, ttl: 30 * 24 * 60 * 60 * 1000, encoding: cookiePolicyEncoding, path: '/', isSameSite: 'Lax' })
    s.state('set_cookie_usage', { ...base, ttl: 30 * 24 * 60 * 60 * 1000, encoding: 'none', path: '/', isSameSite: 'Lax' })
    s.state('seen_cookie_message', { ...base, ttl: 400 * 24 * 60 * 60 * 1000, encoding: 'none', path: '/', isSameSite: 'Lax' })
    s.state('google-analytics-opt-out', { ...base, ttl: 30 * 24 * 60 * 60 * 1000, encoding: 'none', path: '/', isSameSite: 'Lax' })
    s.state('_ga', { ...base, path: '/', encoding: 'none' })
    s.state('_gid', { ...base, path: '/', encoding: 'none' })
    s.state('_gat', { ...base, path: '/', encoding: 'none' })
  }

  const setupGetServer = async (server, { cookiePolicyEncoding = 'base64json' } = {}) => {
    const floodService = require('../../server/services/flood')
    sandbox.stub(floodService, 'getFloods').callsFake(() => ({ floods: [{ isDummyData: false }] }))
    floodService.floods = await floodService.getFloods()
    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/on-post-handler'))
    await server.register(cookiesPlugin)
    registerCookieStates(server, { cookiePolicyEncoding })
    await server.initialize()
  }

  const setupPostServer = async (server) => {
    await server.register(cookiesPlugin)
    registerCookieStates(server)
    await server.initialize()
  }

  // base64json-encode a cookie_policy value (no padding, safe in cookie headers)
  const encodePolicy = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/, '')

  const setCookies = (response) => response.headers['set-cookie'] || []
  const cookieIsSet = (response, name) => setCookies(response).some(c => c.startsWith(`${name}=`) && !c.startsWith(`${name}=;`))
  const cookieIsCleared = (response, name) => setCookies(response).some(c => c.startsWith(`${name}=;`))

  it('should set cookie preferences to deal with attempted XSS', async () => {
    const fakeFloodsData = () => {
      return { floods: [{ isDummyData: false }] }
    }

    const floodService = require('../../server/services/flood')

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodsData)

    floodService.floods = await floodService.getFloods()

    const plugin = {
      plugin: {
        name: 'cookies',
        register: (server) => {
          server.route(require('../../server/routes/cookies'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/on-post-handler'))
    await server.register(plugin)

    await server.state('seen_cookie_message', {
      ttl: 1000 * 60 * 60 * 24 * 7 // 7 days lifetime
    })

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/cookies',
      headers: {
        referer: `${siteUrl}" onclick="alert(10);`,
        cookie: 'session=Fe26.2**befad4d774227dd9d530ab6d7d5fdd6ffa6acdc214808232c97896b54f393546*-42Hz0QDpHukVQ9pk3f8Xg*ZSSkETU1Dyh8sN30OT57kimJ8BFq_LYlmoZqKM_zOgcGpzdoC0sPhf4i6lQkTtfxqfF44bdZ4Sgw4sQIVRj9Zg**aa0291c36455798c20a3b5acca584f1347f77283d8e5b23d7fb70b20d1a46969*S4qqQ9wA8ohva--5hkBmy4TlqtFvcxVuMb82g0laWlA; seen_cookie_message=true; set_cookie_usage=true; _ga=GA1.1.1682777723.1629978783; _gid=GA1.1.1507300460.1629978783'
      }

    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('cookies')
    expect(response.headers['content-type']).to.include('text/html')
    expect(response.request.headers.referer).to.equal(`${siteUrl}" onclick="alert(10);`)
    expect(response.payload).to.not.include('Go back to the page you were looking at')
    expect(response.request.state.seen_cookie_message).to.equal('true')
    expect(response.request.state.set_cookie_usage).to.equal('true')
    expect(response.request.state._ga).to.equal('GA1.1.1682777723.1629978783')
  })

  it('should set cookie preferences with corrupt referer', async () => {
    const fakeFloodsData = () => {
      return { floods: [{ isDummyData: false }] }
    }

    const floodService = require('../../server/services/flood')

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodsData)

    floodService.floods = await floodService.getFloods()

    const plugin = {
      plugin: {
        name: 'cookies',
        register: (server) => {
          server.route(require('../../server/routes/cookies'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/on-post-handler'))
    await server.register(plugin)

    await server.state('seen_cookie_message', {
      ttl: 1000 * 60 * 60 * 24 * 7 // 7 days lifetime
    })

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/cookies',
      headers: {
        referer: 'javascript:alert(\'injection here\')',
        cookie: 'session=Fe26.2**befad4d774227dd9d530ab6d7d5fdd6ffa6acdc214808232c97896b54f393546*-42Hz0QDpHukVQ9pk3f8Xg*ZSSkETU1Dyh8sN30OT57kimJ8BFq_LYlmoZqKM_zOgcGpzdoC0sPhf4i6lQkTtfxqfF44bdZ4Sgw4sQIVRj9Zg**aa0291c36455798c20a3b5acca584f1347f77283d8e5b23d7fb70b20d1a46969*S4qqQ9wA8ohva--5hkBmy4TlqtFvcxVuMb82g0laWlA; seen_cookie_message=true; set_cookie_usage=true; _ga=GA1.1.1682777723.1629978783; _gid=GA1.1.1507300460.1629978783'
      }

    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('cookies')
    expect(response.payload).to.not.include('Go back to the page you were looking at')
    expect(response.headers['content-type']).to.include('text/html')
    expect(response.request.state.seen_cookie_message).to.equal('true')
    expect(response.request.state.set_cookie_usage).to.equal('true')
    expect(response.request.state._ga).to.equal('GA1.1.1682777723.1629978783')
  })

  it('should set cookie preferences with valid referer', async () => {
    const fakeFloodsData = () => {
      return { floods: [{ isDummyData: false }] }
    }

    const floodService = require('../../server/services/flood')

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodsData)

    floodService.floods = await floodService.getFloods()

    const plugin = {
      plugin: {
        name: 'cookies',
        register: (server) => {
          server.route(require('../../server/routes/cookies'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/on-post-handler'))
    await server.register(plugin)

    await server.state('seen_cookie_message', {
      ttl: 1000 * 60 * 60 * 24 * 7 // 7 days lifetime
    })

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/cookies',
      headers: {
        referer: `${siteUrl}/`,
        cookie: 'session=Fe26.2**befad4d774227dd9d530ab6d7d5fdd6ffa6acdc214808232c97896b54f393546*-42Hz0QDpHukVQ9pk3f8Xg*ZSSkETU1Dyh8sN30OT57kimJ8BFq_LYlmoZqKM_zOgcGpzdoC0sPhf4i6lQkTtfxqfF44bdZ4Sgw4sQIVRj9Zg**aa0291c36455798c20a3b5acca584f1347f77283d8e5b23d7fb70b20d1a46969*S4qqQ9wA8ohva--5hkBmy4TlqtFvcxVuMb82g0laWlA; seen_cookie_message=true; set_cookie_usage=true; _ga=GA1.1.1682777723.1629978783; _gid=GA1.1.1507300460.1629978783'
      }

    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('cookies')
    expect(response.payload).to.include('Go back to the page you were looking at')
    expect(response.headers['content-type']).to.include('text/html')
    expect(response.request.state.seen_cookie_message).to.equal('true')
    expect(response.request.state.set_cookie_usage).to.equal('true')
    expect(response.request.state._ga).to.equal('GA1.1.1682777723.1629978783')
  })

  it('GET /cookies - reads cookie_policy object { analytics: true } and pre-selects Yes', async () => {
    await setupGetServer(server)
    const response = await server.inject({
      method: 'GET',
      url: '/cookies',
      headers: { cookie: `cookie_policy=${encodePolicy({ analytics: true })}` }
    })
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('value="accept" checked')
  })

  it('GET /cookies - reads cookie_policy object { analytics: false } and pre-selects No', async () => {
    await setupGetServer(server)
    const response = await server.inject({
      method: 'GET',
      url: '/cookies',
      headers: { cookie: `cookie_policy=${encodePolicy({ analytics: false })}` }
    })
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('value="reject" checked')
  })

  it('GET /cookies - falls back to set_cookie_usage=true when no cookie_policy present', async () => {
    await setupGetServer(server)
    const response = await server.inject({
      method: 'GET',
      url: '/cookies',
      headers: { cookie: 'set_cookie_usage=true' }
    })
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('value="accept" checked')
  })

  it('GET /cookies - defaults to analytics off when no consent cookies present', async () => {
    await setupGetServer(server)
    const response = await server.inject({ method: 'GET', url: '/cookies' })
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('value="reject" checked')
  })

  it('GET /cookies - reads cookie_policy as a JSON string when encoding is none', async () => {
    await setupGetServer(server, { cookiePolicyEncoding: 'none' })
    const response = await server.inject({
      method: 'GET',
      url: '/cookies',
      headers: { cookie: 'cookie_policy={"analytics":true}' }
    })
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include('value="accept" checked')
  })

  it('GET /cookies - clears referer when path after siteUrl has no leading slash', async () => {
    await setupGetServer(server)
    const response = await server.inject({
      method: 'GET',
      url: '/cookies',
      headers: { referer: `${siteUrl}no-leading-slash` }
    })
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.not.include('Go back to the page you were looking at')
  })

  it('POST /cookie-preferences accept - redirects with cookie_choice_made=accept', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept&returnUrl=/',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/?cookie_choice_made=accept')
  })

  it('POST /cookie-preferences accept - sets cookie_policy, seen_cookie_message and set_cookie_usage', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept&returnUrl=/',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(cookieIsSet(response, 'cookie_policy')).to.be.true()
    expect(cookieIsSet(response, 'seen_cookie_message')).to.be.true()
    expect(cookieIsSet(response, 'set_cookie_usage')).to.be.true()
  })

  it('POST /cookie-preferences accept - clears google-analytics-opt-out', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept&returnUrl=/',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: 'google-analytics-opt-out=true'
      }
    })
    expect(cookieIsCleared(response, 'google-analytics-opt-out')).to.be.true()
  })

  it('POST /cookie-preferences reject - redirects with cookie_choice_made=reject', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=reject&returnUrl=/',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/?cookie_choice_made=reject')
  })

  it('POST /cookie-preferences reject - sets google-analytics-opt-out and clears set_cookie_usage', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=reject&returnUrl=/',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(cookieIsSet(response, 'google-analytics-opt-out')).to.be.true()
    expect(cookieIsCleared(response, 'set_cookie_usage')).to.be.true()
  })

  it('POST /cookie-preferences reject - clears GA cookies present on the request', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=reject&returnUrl=/',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: '_ga=GA1.1.123.456; _gid=GA1.1.111.222'
      }
    })
    expect(cookieIsCleared(response, '_ga')).to.be.true()
    expect(cookieIsCleared(response, '_gid')).to.be.true()
  })

  it('POST /cookie-preferences reject on .defra.cloud - adds domain-scoped clear for GA cookies', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=reject&returnUrl=/',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        host: 'example.defra.cloud',
        cookie: '_ga=GA1.1.123.456'
      }
    })
    const hasDefraCloudClear = setCookies(response).some(c => c.startsWith('_ga=;') && c.includes('defra.cloud'))
    expect(hasDefraCloudClear).to.be.true()
  })

  it('POST /cookie-preferences - invalid choice is treated as reject', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=invalid&returnUrl=/',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/?cookie_choice_made=reject')
  })

  it('POST /cookie-preferences - uses valid relative returnUrl in redirect', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept&returnUrl=/some-page',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.headers.location).to.equal('/some-page?cookie_choice_made=accept')
  })

  it('POST /cookie-preferences - sanitises external returnUrl to /', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept&returnUrl=http://evil.com',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.headers.location).to.equal('/?cookie_choice_made=accept')
  })

  it('POST /cookie-preferences - sanitises protocol-relative returnUrl to /', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept&returnUrl=//evil.com',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.headers.location).to.equal('/?cookie_choice_made=accept')
  })

  it('POST /cookie-preferences - defaults returnUrl to / when missing', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.headers.location).to.equal('/?cookie_choice_made=accept')
  })

  it('POST /cookie-preferences - returns JSON for AJAX accept (X-Requested-With)', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept&returnUrl=/',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-requested-with': 'XMLHttpRequest'
      }
    })
    expect(response.statusCode).to.equal(200)
    const result = JSON.parse(response.payload)
    expect(result.choice).to.equal('accept')
    expect(result.redirectUrl).to.equal('/?cookie_choice_made=accept')
    expect(cookieIsSet(response, 'cookie_policy')).to.be.true()
  })

  it('POST /cookie-preferences - returns JSON for AJAX reject (Accept: application/json)', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=reject&returnUrl=/',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json'
      }
    })
    expect(response.statusCode).to.equal(200)
    const result = JSON.parse(response.payload)
    expect(result.choice).to.equal('reject')
    expect(result.redirectUrl).to.equal('/?cookie_choice_made=reject')
    expect(cookieIsSet(response, 'google-analytics-opt-out')).to.be.true()
  })

  // ---- GET /cookies - referer sanitisation ----

  it('GET /cookies - keeps a referer that is exactly the site url', async () => {
    await setupGetServer(server)
    const response = await server.inject({
      method: 'GET',
      url: '/cookies',
      headers: { referer: siteUrl }
    })
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.include(`href="${siteUrl}"`)
  })

  // ---- POST /cookie-preferences - payload edge cases ----

  it('POST /cookie-preferences - rejects analytics when there is no payload at all', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences'
    })
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/?cookie_choice_made=reject')
    expect(cookieIsSet(response, 'google-analytics-opt-out')).to.be.true()
  })

  it('POST /cookie-preferences - defaults the redirect when returnUrl is missing', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: 'analytics-consent=accept',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/?cookie_choice_made=accept')
  })

  it('POST /cookie-preferences - defaults the redirect when returnUrl is not a string', async () => {
    await setupPostServer(server)
    const response = await server.inject({
      method: 'POST',
      url: '/cookie-preferences',
      payload: { 'analytics-consent': 'accept', returnUrl: 123 },
      headers: { 'content-type': 'application/json' }
    })
    expect(response.statusCode).to.equal(302)
    expect(response.headers.location).to.equal('/?cookie_choice_made=accept')
  })
})
