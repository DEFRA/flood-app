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
})
