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
    await server.state('set_cookie_usage', {
      ttl: 1000 * 60 * 60 * 24 * 7 // 7 days lifetime
    })
    await server.initialize()

    const options = {
      method: 'GET',
      url: '/cookies'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.include('cookies')
    Code.expect(response.headers['content-type']).to.include('text/html')
    Code.expect(response.request.server.states.cookies.seen_cookie_message.strictHeader).to.be.a.boolean().and.to.equal(true)
    Code.expect(response.request.server.states.cookies.set_cookie_usage.strictHeader).to.be.a.boolean().and.to.equal(true)
  })
})
