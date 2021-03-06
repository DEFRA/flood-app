'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()

lab.experiment('Routes test - river-and-sea-levels', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
    sandbox = await sinon.createSandbox()
    server = Hapi.server({
      port: 3000,
      host: 'localhost'
    })

    const riversPlugin = {
      plugin: {
        name: 'river-and-sea-levels',
        register: (server, options) => {
          server.route(require('../../server/routes/river-and-sea-levels'))
        }
      }
    }

    await server.register(require('@hapi/inert'))
    await server.register(require('@hapi/h2o2'))
    await server.register(require('../../server/plugins/session'))
    await server.register(require('../../server/plugins/views'))
    await server.register(riversPlugin)
    await server.initialize()
  })

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
    const regex = /.\/server\/models\/./
    Object.keys(require.cache).forEach((key) => {
      if (key.match(regex)) {
        delete require.cache[key]
      }
    })
  })

  lab.test('POST /river-and-sea-levels', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'q=warrington'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })
  lab.test('POST /river-and-sea-levels payload fails joi validation', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: {
        test: 'test'
      }
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(400)
  })
  lab.test('POST /river-and-sea-levels with blank location', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'q='
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers['content-type']).to.include('text/html')
  })

  lab.test('POST /river-and-sea-levels types S,M', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'types=S,M'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
    Code.expect(response.request.yar.get('redirect')).to.be.true()
    Code.expect(response.request.yar.get('q')).to.be.null()
    Code.expect(response.request.yar.get('ta-code')).to.be.null()
    Code.expect(response.request.yar.get('types')).to.equal('S,M')
    Code.expect(response.request.yar.get('river-id')).to.be.null()
  })

  lab.test('POST /river-and-sea-levels types S,M & G', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'types=S,M&types=G'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
    Code.expect(response.request.yar.get('redirect')).to.be.true()
    Code.expect(response.request.yar.get('q')).to.be.null()
    Code.expect(response.request.yar.get('ta-code')).to.be.null()
    Code.expect(response.request.yar.get('types')).to.equal('S,M,G')
    Code.expect(response.request.yar.get('river-id')).to.be.null()
  })

  lab.test('POST /river-and-sea-levels all params', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'types=S,M&types=G&river-id=test&river-id=test1&target-area=test&q=test&rloi-id=5050'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
    Code.expect(response.request.yar.get('redirect')).to.be.true()
    Code.expect(response.request.yar.get('q')).to.be.equal('test')
    Code.expect(response.request.yar.get('ta-code')).to.be.equal('test')
    Code.expect(response.request.yar.get('types')).to.equal('S,M,G')
    Code.expect(response.request.yar.get('river-id')).to.be.equal('test,test1')
    Code.expect(response.request.yar.get('rloi-id')).to.be.equal('5050')
  })

  lab.test('POST /river-and-sea-levels with location', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'q=test'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels?q=test')
    Code.expect(response.request.yar.get('redirect')).to.be.null()
  })

  lab.test('POST /river-and-sea-levels with target area', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'target-area=test'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels?target-area=test')
    Code.expect(response.request.yar.get('redirect')).to.be.null()
  })

  lab.test('POST /river-and-sea-levels with nothing', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: ''
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
    Code.expect(response.request.yar.get('redirect')).to.be.null()
  })

  lab.test('POST /river-and-sea-levels types S,M & G', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'river-id=test'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels')
    Code.expect(response.request.yar.get('redirect')).to.be.true()
    Code.expect(response.request.yar.get('q')).to.be.null()
    Code.expect(response.request.yar.get('ta-code')).to.be.null()
    Code.expect(response.request.yar.get('types')).to.be.null()
    Code.expect(response.request.yar.get('river-id')).to.be.equal('test')
  })
  lab.test('POST /river-and-sea-levels with rloi-id', async () => {
    const options = {
      method: 'POST',
      url: '/river-and-sea-levels',
      payload: 'rloi-id=5050'
    }

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(302)
    Code.expect(response.headers.location).to.equal('/river-and-sea-levels?rloi-id=5050')
    Code.expect(response.request.yar.get('redirect')).to.be.null()
  })
})
