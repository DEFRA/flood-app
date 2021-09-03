'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Get Cookies test', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3009,
      host: 'localhost'
    })
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('GET /cookies and set cookie preferences', async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/plugins/on-post-handler.js')]

    const fakeFloodsData = () => {
      return { floods: [{ isDummyData: false }] }
    }

    const floodService = require('../../server/services/flood')
    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodsData)
    floodService.floods = await floodService.getFloods()

    const plugin = {
      plugin: {
        name: 'cookies',
        register: (server, options) => {
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
        referer: 'referer_page',
        cookie: 'session=Fe26.2**befad4d774227dd9d530ab6d7d5fdd6ffa6acdc214808232c97896b54f393546*-42Hz0QDpHukVQ9pk3f8Xg*ZSSkETU1Dyh8sN30OT57kimJ8BFq_LYlmoZqKM_zOgcGpzdoC0sPhf4i6lQkTtfxqfF44bdZ4Sgw4sQIVRj9Zg**aa0291c36455798c20a3b5acca584f1347f77283d8e5b23d7fb70b20d1a46969*S4qqQ9wA8ohva--5hkBmy4TlqtFvcxVuMb82g0laWlA; seen_cookie_message=true; set_cookie_usage=true; _ga=GA1.1.1682777723.1629978783; _gid=GA1.1.1507300460.1629978783'
      }

    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('cookies')
    Code.expect(response.headers['content-type']).to.include('text/html')
    Code.expect(response.request.headers.referer).to.equal('referer_page')
    Code.expect(response.request.state.seen_cookie_message).to.equal('true')
    Code.expect(response.request.state.set_cookie_usage).to.equal('true')
    Code.expect(response.request.state._ga).to.equal('GA1.1.1682777723.1629978783')
  })
})
